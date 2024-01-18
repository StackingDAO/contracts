;; @contract Stacking Strategy
;; @version 1

;;-------------------------------------
;; Constants
;;-------------------------------------

(define-constant ERR_CYCLE_ALREADY_PREPARED u12001)
(define-constant ERR_CAN_NOT_PREPARE u12002)

;; TODO: update for mainnet (48 blocks = last 8h)
(define-constant CUSTOM_PREPARE_CYCLE_LENGTH u2)

;;-------------------------------------
;; Track cycles
;;-------------------------------------

(define-data-var last-cycle-performed uint u0)

(define-read-only (get-last-cycle-performed)
  (var-get last-cycle-performed)
)

;;-------------------------------------
;; Reward address
;;-------------------------------------

(define-data-var pox-reward-address { version: (buff 1), hashbytes: (buff 32) } { version: 0x00, hashbytes: 0xf632e6f9d29bfb07bc8948ca6e0dd09358f003ac })

(define-read-only (get-pox-reward-address)
  (var-get pox-reward-address)
)

(define-public (set-pox-reward-address (new-address { version: (buff 1), hashbytes: (buff 32) }))
  (begin
    (try! (contract-call? .dao check-is-protocol tx-sender))

    (var-set pox-reward-address new-address)
    (ok true)
  )
)

;;-------------------------------------
;; PoX info 
;;-------------------------------------

(define-read-only (get-pox-cycle)
  ;; TODO: update for mainnet
  (contract-call? .pox-3-mock current-pox-reward-cycle)
)

(define-read-only (get-next-cycle-start-burn-height)
  ;; TODO: update for mainnet
  (contract-call? .pox-3-mock reward-cycle-to-burn-height (+ (get-pox-cycle) u1))
)

(define-read-only (get-stacking-minimum)
  ;; TODO: update for mainnet
  (contract-call? .pox-3-mock get-stacking-minimum)
)

(define-read-only (get-prepare-cycle-length)
  ;; TODO: update for mainnet
  (get prepare-cycle-length (unwrap-panic (contract-call? .pox-3-mock get-pox-info)))
)

;;-------------------------------------
;; Perform 
;;-------------------------------------

(define-public (perform-stacking)
  (let (
    (outflow-inflow (get-outflow-inflow))
    (outflow (get outflow outflow-inflow))
    (inflow (get inflow outflow-inflow))
  )
    (asserts! (>= burn-block-height (- (get-next-cycle-start-burn-height) CUSTOM_PREPARE_CYCLE_LENGTH)) (err ERR_CAN_NOT_PREPARE))

    (if (> outflow u0)
      (let (
        (outflow-list (calculate-outflow outflow))
      )
        (perform-outflow outflow-list)
      )
      (let (
        (inflow-list (calculate-inflow inflow))
      )
        (perform-inflow inflow-list)
      )
    )
  )
)

;;-------------------------------------
;; Inflow/outflow info 
;;-------------------------------------

(define-read-only (get-total-stacking)
  (unwrap-panic (contract-call? .reserve-v1 get-stx-stacking))
)

(define-read-only (get-outflow-inflow)
  (let (
    (total-withdrawals (unwrap-panic (contract-call? .reserve-v1 get-stx-for-withdrawals)))
    (total-idle (unwrap-panic (contract-call? .reserve-v1 get-stx-balance)))

    (outflow 
      (if (> total-withdrawals total-idle)
        (- total-withdrawals total-idle)
        u0
      )
    )

    (inflow 
      (if (> total-idle total-withdrawals )
        (- total-idle total-withdrawals )
        u0
      )
    )
  )
    { outflow: outflow, inflow: inflow, total-stacking: (get-total-stacking), total-idle: total-idle, total-withdrawals: total-withdrawals }
  )
)

;;-------------------------------------
;; Inflow
;;-------------------------------------

;; Returns 1 if stacker idle (= not stacking), 0 otherwise
(define-read-only (is-stacker-idle (stacker-id uint))
  (let (
    (stacking-amount (stackers-get-total-stacking stacker-id))
  )
    (if (is-eq stacking-amount u0)
      u1
      u0
    )
  )
)

;; Get additional amount to stack per stacker
(define-read-only (calculate-inflow (inflow uint)) 
  (let (
    (min-amount (get-stacking-minimum))
    (stacker-ids (list u1 u2 u3 u4 u5 u6 u7 u8 u9 u10))

    ;; Number of stackers idle and started
    (stackers-idle (fold + (map is-stacker-idle stacker-ids) u0))
    (stackers-started (- u10 stackers-idle))

    ;; Number of stackers to start
    (stackers-to-start (if (is-eq stackers-started u10)
      u0
      (let (
        (stackers-can-be-started (/ (- inflow (mod inflow min-amount)) min-amount))
      )
        (if (> stackers-can-be-started u10)
          u10
          stackers-can-be-started
        )
      )
    ))

    ;; Number of stackers that will be used
    (stackers-will-be-used (+ stackers-started stackers-to-start))

    ;; Additional amount to divide over stackers
    ;; First we make sure the inflow is used to start as many stackers as possible. They need to reach the min stacking amount.
    ;; The extra inflow that is left is divided equally over the last started stackers. Max 5 last stackers used to divide amongst.
    (additional-amount 
      ;; No stackers used at all
      (if (is-eq stackers-will-be-used u0)
        u0
        ;; Stackers used, divide extra inflow
        (if (> stackers-will-be-used u5)
          (/ (- inflow (* stackers-to-start min-amount)) u5)
          (/ (- inflow (* stackers-to-start min-amount)) stackers-will-be-used)
        )
      )
    )

    ;; Lists to use in map function
    (stackers-started-list (list stackers-started stackers-started stackers-started stackers-started stackers-started stackers-started stackers-started stackers-started stackers-started stackers-started))
    (stackers-to-start-list (list stackers-to-start stackers-to-start stackers-to-start stackers-to-start stackers-to-start stackers-to-start stackers-to-start stackers-to-start stackers-to-start stackers-to-start))
    (additional-amount-list (list additional-amount additional-amount additional-amount additional-amount additional-amount additional-amount additional-amount additional-amount additional-amount additional-amount))
  )
    (map calculate-inflow-helper stacker-ids stackers-started-list stackers-to-start-list additional-amount-list)
  )
)

;; Helper to calculate inflow per stacker
(define-read-only (calculate-inflow-helper (stacker-id uint) (stackers-started uint) (stackers-to-start uint) (additional-amount uint)) 
  (begin
    (if (and (<= stacker-id (- u10 stackers-started)) (> stacker-id (- u10 (+ stackers-started stackers-to-start))))
      ;; Should start stacker
      (if (> stacker-id u5)
        (+ (get-stacking-minimum) additional-amount)
        (get-stacking-minimum)
      )

      ;; Stacker already started
      (if (> stacker-id (- u10 stackers-started))
        additional-amount

        ;; Stacker should not start and is not started
        u0
      )
    )
  )
)

;; Provide list where each element is amount to increase
;; List index corresponds to stacker id + 1
(define-public (perform-inflow (stacking-amounts (list 10 uint)))
  (let (
    (next-cycle (+ (get-pox-cycle) u1))
  )
    (try! (contract-call? .dao check-is-protocol contract-caller))
    (asserts! (< (var-get last-cycle-performed) next-cycle) (err ERR_CYCLE_ALREADY_PREPARED))

    (try! (perform-inflow-for-stacker u1 (unwrap-panic (element-at stacking-amounts u0))))
    (try! (perform-inflow-for-stacker u2 (unwrap-panic (element-at stacking-amounts u1))))
    (try! (perform-inflow-for-stacker u3 (unwrap-panic (element-at stacking-amounts u2))))
    (try! (perform-inflow-for-stacker u4 (unwrap-panic (element-at stacking-amounts u3))))
    (try! (perform-inflow-for-stacker u5 (unwrap-panic (element-at stacking-amounts u4))))
    (try! (perform-inflow-for-stacker u6 (unwrap-panic (element-at stacking-amounts u5))))
    (try! (perform-inflow-for-stacker u7 (unwrap-panic (element-at stacking-amounts u6))))
    (try! (perform-inflow-for-stacker u8 (unwrap-panic (element-at stacking-amounts u7))))
    (try! (perform-inflow-for-stacker u9 (unwrap-panic (element-at stacking-amounts u8))))
    (try! (perform-inflow-for-stacker u10 (unwrap-panic (element-at stacking-amounts u9))))

    (var-set last-cycle-performed next-cycle)
    (ok true)
  )
)

(define-private (perform-inflow-for-stacker (stacker-id uint) (amount uint))
  (let (
    (current-stacking-amount (stackers-get-total-stacking stacker-id))
  )
    (if (is-eq amount u0)
      (if (is-eq current-stacking-amount u0)
        ;; Not stacking so nothing to do
        u0
        ;; Nothing to stack, just extend
        (try! (stackers-stack-extend stacker-id))
      )

      (if (is-eq current-stacking-amount u0)
        ;; Not stacking yet, initiate
        (try! (stackers-initiate-stacking stacker-id amount))

        ;; Already stacking, increase and extend
        (begin
          (try! (stackers-stack-increase stacker-id amount))
          (try! (stackers-stack-extend stacker-id))
        )
      )
    )
    (ok true)
  )
)

;;-------------------------------------
;; Outflow
;;-------------------------------------

;; Get stackers to stop
(define-read-only (calculate-outflow (outflow uint)) 
  (let (
    (total-1 (fold + (map stackers-get-total-stacking (list u1)) u0))
    (total-2 (fold + (map stackers-get-total-stacking (list u1 u2)) u0))
    (total-3 (fold + (map stackers-get-total-stacking (list u1 u2 u3)) u0))
    (total-4 (fold + (map stackers-get-total-stacking (list u1 u2 u3 u4)) u0))
    (total-5 (fold + (map stackers-get-total-stacking (list u1 u2 u3 u4 u5)) u0))
    (total-6 (fold + (map stackers-get-total-stacking (list u1 u2 u3 u4 u5 u6)) u0))
    (total-7 (fold + (map stackers-get-total-stacking (list u1 u2 u3 u4 u5 u6 u7)) u0))
    (total-8 (fold + (map stackers-get-total-stacking (list u1 u2 u3 u4 u5 u6 u7 u8)) u0))
    (total-9 (fold + (map stackers-get-total-stacking (list u1 u2 u3 u4 u5 u6 u7 u8 u9)) u0))
    (total-10 (fold + (map stackers-get-total-stacking (list u1 u2 u3 u4 u5 u6 u7 u8 u9 u10)) u0))
  )
    (if (<= outflow total-1) (list true false false false false false false false false false)
    (if (<= outflow total-2) (list true true false false false false false false false false)
    (if (<= outflow total-3) (list true true true false false false false false false false)
    (if (<= outflow total-4) (list true true true true false false false false false false)
    (if (<= outflow total-5) (list true true true true true false false false false false)
    (if (<= outflow total-6) (list true true true true true true false false false false)
    (if (<= outflow total-7) (list true true true true true true true false false false)
    (if (<= outflow total-8) (list true true true true true true true true false false)
    (if (<= outflow total-9) (list true true true true true true true true true false)
    (if (<= outflow total-10) (list true true true true true true true true true true)

      (list false false false false false false false false false false)
    ))))))))))
  )
)

;; Provide list where each element is a boolean (false to continue stacking, true to stop)
;; List index corresponds to stacker id + 1
(define-public (perform-outflow (stackers-to-stop (list 10 bool)))
  (let (
    (next-cycle (+ (get-pox-cycle) u1))
  )
    (try! (contract-call? .dao check-is-protocol contract-caller))
    (asserts! (< (var-get last-cycle-performed) next-cycle) (err ERR_CYCLE_ALREADY_PREPARED))

    (try! (perform-outflow-for-stacker u1 (unwrap-panic (element-at stackers-to-stop u0))))
    (try! (perform-outflow-for-stacker u2 (unwrap-panic (element-at stackers-to-stop u1))))
    (try! (perform-outflow-for-stacker u3 (unwrap-panic (element-at stackers-to-stop u2))))
    (try! (perform-outflow-for-stacker u4 (unwrap-panic (element-at stackers-to-stop u3))))
    (try! (perform-outflow-for-stacker u5 (unwrap-panic (element-at stackers-to-stop u4))))
    (try! (perform-outflow-for-stacker u6 (unwrap-panic (element-at stackers-to-stop u5))))
    (try! (perform-outflow-for-stacker u7 (unwrap-panic (element-at stackers-to-stop u6))))
    (try! (perform-outflow-for-stacker u8 (unwrap-panic (element-at stackers-to-stop u7))))
    (try! (perform-outflow-for-stacker u9 (unwrap-panic (element-at stackers-to-stop u8))))
    (try! (perform-outflow-for-stacker u10 (unwrap-panic (element-at stackers-to-stop u9))))

    (var-set last-cycle-performed next-cycle)
    (ok true)
  )
)

(define-private (perform-outflow-for-stacker (stacker-id uint) (stop bool))
  (let (
    (current-stacking-amount (stackers-get-total-stacking stacker-id))
  )
    ;; Extend if should not stop and was stacking
    (if (and (is-eq stop false) (> current-stacking-amount u0))
      (try! (stackers-stack-extend stacker-id))
      u0
    )
    (ok true)
  )
)

;;-------------------------------------
;; Stacker Actions 
;;-------------------------------------

(define-read-only (stackers-get-total-stacking (stacker-id uint))
  (if (is-eq stacker-id u1) (contract-call? .stacker-1 get-stx-stacked)
  (if (is-eq stacker-id u2) (contract-call? .stacker-2 get-stx-stacked)
  (if (is-eq stacker-id u3) (contract-call? .stacker-3 get-stx-stacked)
  (if (is-eq stacker-id u4) (contract-call? .stacker-4 get-stx-stacked)
  (if (is-eq stacker-id u5) (contract-call? .stacker-5 get-stx-stacked)
  (if (is-eq stacker-id u6) (contract-call? .stacker-6 get-stx-stacked)
  (if (is-eq stacker-id u7) (contract-call? .stacker-7 get-stx-stacked)
  (if (is-eq stacker-id u8) (contract-call? .stacker-8 get-stx-stacked)
  (if (is-eq stacker-id u9) (contract-call? .stacker-9 get-stx-stacked)
  (if (is-eq stacker-id u10) (contract-call? .stacker-10 get-stx-stacked)
   u0
  ))))))))))
)

(define-public (stackers-return-stx)
  (begin
    (try! (contract-call? .stacker-1 return-stx .reserve-v1))
    (try! (contract-call? .stacker-2 return-stx .reserve-v1))
    (try! (contract-call? .stacker-3 return-stx .reserve-v1))
    (try! (contract-call? .stacker-4 return-stx .reserve-v1))
    (try! (contract-call? .stacker-5 return-stx .reserve-v1))
    (try! (contract-call? .stacker-6 return-stx .reserve-v1))
    (try! (contract-call? .stacker-7 return-stx .reserve-v1))
    (try! (contract-call? .stacker-8 return-stx .reserve-v1))
    (try! (contract-call? .stacker-9 return-stx .reserve-v1))
    (try! (contract-call? .stacker-10 return-stx .reserve-v1))
    (ok true)
  )
)

(define-private (stackers-initiate-stacking (stacker-id uint) (amount uint))
  (if (is-eq stacker-id u1) (contract-call? .stacker-1 initiate-stacking .reserve-v1 (var-get pox-reward-address) amount burn-block-height u1)
  (if (is-eq stacker-id u2) (contract-call? .stacker-2 initiate-stacking .reserve-v1 (var-get pox-reward-address) amount burn-block-height u1)
  (if (is-eq stacker-id u3) (contract-call? .stacker-3 initiate-stacking .reserve-v1 (var-get pox-reward-address) amount burn-block-height u1)
  (if (is-eq stacker-id u4) (contract-call? .stacker-4 initiate-stacking .reserve-v1 (var-get pox-reward-address) amount burn-block-height u1)
  (if (is-eq stacker-id u5) (contract-call? .stacker-5 initiate-stacking .reserve-v1 (var-get pox-reward-address) amount burn-block-height u1)
  (if (is-eq stacker-id u6) (contract-call? .stacker-6 initiate-stacking .reserve-v1 (var-get pox-reward-address) amount burn-block-height u1)
  (if (is-eq stacker-id u7) (contract-call? .stacker-7 initiate-stacking .reserve-v1 (var-get pox-reward-address) amount burn-block-height u1)
  (if (is-eq stacker-id u8) (contract-call? .stacker-8 initiate-stacking .reserve-v1 (var-get pox-reward-address) amount burn-block-height u1)
  (if (is-eq stacker-id u9) (contract-call? .stacker-9 initiate-stacking .reserve-v1 (var-get pox-reward-address) amount burn-block-height u1)
  (if (is-eq stacker-id u10) (contract-call? .stacker-10 initiate-stacking .reserve-v1 (var-get pox-reward-address) amount burn-block-height u1)
    (ok u0)
  ))))))))))
)

(define-private (stackers-stack-increase (stacker-id uint) (additional-amount uint))
  (if (is-eq stacker-id u1) (contract-call? .stacker-1 stack-increase .reserve-v1 additional-amount)
  (if (is-eq stacker-id u2) (contract-call? .stacker-2 stack-increase .reserve-v1 additional-amount)
  (if (is-eq stacker-id u3) (contract-call? .stacker-3 stack-increase .reserve-v1 additional-amount)
  (if (is-eq stacker-id u4) (contract-call? .stacker-4 stack-increase .reserve-v1 additional-amount)
  (if (is-eq stacker-id u5) (contract-call? .stacker-5 stack-increase .reserve-v1 additional-amount)
  (if (is-eq stacker-id u6) (contract-call? .stacker-6 stack-increase .reserve-v1 additional-amount)
  (if (is-eq stacker-id u7) (contract-call? .stacker-7 stack-increase .reserve-v1 additional-amount)
  (if (is-eq stacker-id u8) (contract-call? .stacker-8 stack-increase .reserve-v1 additional-amount)
  (if (is-eq stacker-id u9) (contract-call? .stacker-9 stack-increase .reserve-v1 additional-amount)
  (if (is-eq stacker-id u10) (contract-call? .stacker-10 stack-increase .reserve-v1 additional-amount)
   (ok u0)
  ))))))))))
)

(define-private (stackers-stack-extend (stacker-id uint))
  (if (is-eq stacker-id u1) (contract-call? .stacker-1 stack-extend u1 (var-get pox-reward-address))
  (if (is-eq stacker-id u2) (contract-call? .stacker-2 stack-extend u1 (var-get pox-reward-address))
  (if (is-eq stacker-id u3) (contract-call? .stacker-3 stack-extend u1 (var-get pox-reward-address))
  (if (is-eq stacker-id u4) (contract-call? .stacker-4 stack-extend u1 (var-get pox-reward-address))
  (if (is-eq stacker-id u5) (contract-call? .stacker-5 stack-extend u1 (var-get pox-reward-address))
  (if (is-eq stacker-id u6) (contract-call? .stacker-6 stack-extend u1 (var-get pox-reward-address))
  (if (is-eq stacker-id u7) (contract-call? .stacker-7 stack-extend u1 (var-get pox-reward-address))
  (if (is-eq stacker-id u8) (contract-call? .stacker-8 stack-extend u1 (var-get pox-reward-address))
  (if (is-eq stacker-id u9) (contract-call? .stacker-9 stack-extend u1 (var-get pox-reward-address))
  (if (is-eq stacker-id u10) (contract-call? .stacker-10 stack-extend u1 (var-get pox-reward-address))
   (ok u0)
  ))))))))))
)
