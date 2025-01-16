;; @contract Strategy v2
;; @version 1

(use-trait stacking-delegate-trait .stacking-delegate-trait-v1.stacking-delegate-trait)

;;-------------------------------------
;; Constants 
;;-------------------------------------

(define-constant ERR_NO_OUTFLOW_DELEGATE u25001)
(define-constant ERR_DELEGATE_TRAIT u25002)

;;-------------------------------------
;; Variables
;;-------------------------------------

;; Temporary vars for outflow calculation
(define-data-var outflow-delegate (optional principal) none)
(define-data-var outflow-diff uint u0)

;;-------------------------------------
;; Maps
;;-------------------------------------

;; Temporary map for inflow calculation
(define-map inflow-delegate-amount principal uint)
(define-map inflow-delegate-pool principal principal)

;;-------------------------------------
;; Getters
;;-------------------------------------

(define-read-only (get-outflow-delegate)
  (var-get outflow-delegate)
)

(define-read-only (get-outflow-diff)
  (var-get outflow-diff)
)

(define-read-only (get-inflow-delegate-amount (delegate principal))
  (default-to
    u0
    (map-get? inflow-delegate-amount delegate)
  )
)

(define-read-only (get-inflow-delegate-pool (delegate principal))
  (map-get? inflow-delegate-pool delegate)
)

(define-read-only (get-stx-account (account principal))
  ;; TODO: update for mainnet
  (contract-call? .pox-3-mock stx-account-mock account)
  ;; (stx-account account)
)

;;-------------------------------------
;; Perform
;;-------------------------------------

;; TODO: needs to be called by keeper job regularly
(define-public (perform (delegate-traits (list 900 <stacking-delegate-trait>)))
  (let (
    (outflow-inflow (get-outflow-inflow))
  )
    ;; TODO: try! once it returns error
    (unwrap-panic (as-contract (perform-return-stx delegate-traits)))

    (if (>= (get inflow outflow-inflow) u0)
      ;; TODO: try! once it returns error
      (unwrap-panic (as-contract (perform-inflow (get inflow outflow-inflow) delegate-traits)))
      (unwrap-panic (as-contract (perform-outflow (get outflow outflow-inflow) delegate-traits)))
    )

    (ok true)
  )
)

;; TODO: admin should be able to call private methods (in case something goes wrong)

;;-------------------------------------
;; Perform - Return STX
;;-------------------------------------

(define-public (perform-return-stx (delegate-traits (list 900 <stacking-delegate-trait>)))
  (begin
    ;; TODO: does this check work? anyone should be able to call "perform" but not this method
    (try! (contract-call? .dao check-is-protocol contract-caller))

    ;; TODO: check errors
    (map perform-return-stx-helper delegate-traits)

    (ok true)
  )
)

(define-private (perform-return-stx-helper (delegate <stacking-delegate-trait>))
  ;; (contract-call? delegate return-stx .reserve-v1)
  ;; TODO
  (ok true)
)

;;-------------------------------------
;; Perform - Outflow
;;-------------------------------------

(define-read-only (is-outflow-delegate-trait (delegate-trait <stacking-delegate-trait>)) 
  (is-eq (unwrap-panic (get-outflow-delegate)) (contract-of delegate-trait))
)

;; TODO: what if outflow is > largest delegation balance?
(define-private (perform-outflow (outflow uint) (delegate-traits (list 900 <stacking-delegate-trait>)))
  (begin
    ;; Calculate first
    (unwrap-panic (calculate-outflow outflow))

    ;; Perform
    (if (is-none (get-outflow-delegate))
      (err ERR_NO_OUTFLOW_DELEGATE)

      (let (
        (outflow-delegate-traits (filter is-outflow-delegate-trait delegate-traits))
        (outflow-delegate-trait (unwrap! (element-at? outflow-delegate-traits u0) (err ERR_DELEGATE_TRAIT)))
      )
        (try! (contract-call? outflow-delegate-trait revoke .reserve-v1))

        (ok true)
      )
    )
  )
)

;;-------------------------------------
;; Calculate - Outflow
;;-------------------------------------

(define-public (calculate-outflow (outflow uint))
  (let (
    (outflow-list (list-30-uint outflow))
    (active-pools (contract-call? .data-pools-v1 get-active-pools))
  )
    (try! (contract-call? .dao check-is-protocol contract-caller))

    ;; Reset temp vars
    (var-set outflow-diff (pow u2 u125))
    (var-set outflow-delegate none)

    ;; TODO: check for errors (see pool)
    (map calculate-outflow-pool active-pools outflow-list)

    (print { action: "calculate-outflow", data: { outflow-delegate: (get-outflow-delegate), outflow-diff: (get-outflow-delegate), block-height: block-height } })

    (ok true)
  )
)

(define-public (calculate-outflow-pool (pool principal) (outflow uint))
  (let (
    (pool-list (list-30-principal pool))
    (outflow-list (list-30-uint outflow))
    (delegates (contract-call? .data-pools-v1 get-pool-delegates pool))
  )
    (try! (contract-call? .dao check-is-protocol contract-caller))

    ;; TODO: check for errors
    (map calculate-outflow-delegate pool-list delegates outflow-list)

    (ok true)
  )
)

(define-public (calculate-outflow-delegate (pool principal) (delegate principal) (outflow uint))
  (let (
    (delegation-info (contract-call? .pox-3-mock get-check-delegation delegate))
    (delegation-amount (if (is-none delegation-info)
      u0
      (unwrap-panic (get amount-ustx delegation-info))
    ))
  )
    (try! (contract-call? .dao check-is-protocol contract-caller))

    ;; TODO: only perform outflow on pool with most funds?
    (if (> delegation-amount outflow)
      (let (
        (diff (- delegation-amount outflow))
      )
        (if (< diff (var-get outflow-diff))
          (begin
            (var-set outflow-delegate (some delegate))
            (var-set outflow-diff diff)
          )
          false
        )
        false
      )
      false
    )
    (ok true)
  )
)

;;-------------------------------------
;; Perform - Inflow
;;-------------------------------------

(define-private (perform-inflow (inflow uint) (delegate-traits (list 900 <stacking-delegate-trait>)))
  (begin
    ;; Calculate first
    (unwrap-panic (calculate-inflow inflow))

    ;; Perform
    ;; TODO: check for errors
    (map perform-inflow-helper delegate-traits)

    (ok true)
  )
)

;; Loop over every trait
;; For each delegate, find the pool and amount
(define-private (perform-inflow-helper (delegate <stacking-delegate-trait>))
  (let (
    (amount (get-inflow-delegate-amount (contract-of delegate)))
    (pool (get-inflow-delegate-pool (contract-of delegate)))
  )
    (if (and (> amount u0) (is-some pool))
      (begin
        (try! (contract-call? delegate revoke .reserve-v1))
        (try! (contract-call? delegate revoke-and-delegate .reserve-v1 amount (unwrap-panic pool) u10000)) ;; TODO: BLOCK HEIGHT
        (ok true)
      )
      (ok false)
    )
  )
)

;;-------------------------------------
;; Calculate - Inflow
;;-------------------------------------

(define-public (calculate-inflow (inflow uint))
  (let (
    (current-stx-stacking (unwrap-panic (contract-call? .reserve-v1 get-stx-stacking)))
    (new-stx-stacking (+ current-stx-stacking inflow))
    (new-stx-stacking-list (list-30-uint new-stx-stacking))
    (active-pools (contract-call? .data-pools-v1 get-active-pools))
  )
    (try! (contract-call? .dao check-is-protocol contract-caller))

    ;; TODO: calculate overlocked amounts for each pool + save total-overlock along the way
    ;; Using this info, we can calculate the amount of STX per pool
    ;; And provide to next method

    ;; TODO: check for errors
    (map calculate-inflow-pool active-pools new-stx-stacking-list)

    (ok true)
  )
)

(define-read-only (calculate-stx-for-pool (pool principal) (new-stx-stacking uint))
  (let (
    (default-share (contract-call? .data-pools-v1 get-pool-share pool))

    ;; TODO: NEED TO TAKE "OVERLOCKED" INTO ACCOUNT
    ;; because of direct stacking and revoking of delegates it can happen
    ;; that a delegate has locked more than it should. 
    ;; However, as there is an inflow we do not want to revoke a delegate
    ;; So we need to take the "overlocked" amount into account


    
    ;; TODO: get from pools-data
    (direct-share u12)

    ;; TODO: create var and getter/setter
    (direct-dependence u2000) ;; 20% in bps

    ;; TODO: check decimals
    ;; TODO: rounding errors can cause strategy to stop working. if too much STX is requested..
    ;; Maybe just scale down the share a bit?
    (new-share (+
      (* default-share (- u10000 direct-dependence))
      (* direct-share direct-dependence)
    ))

    ;; TODO: based on pools-data?
    (stx-for-default u12)
    (stx-for-direct u123)
  )
    (+ 
      (/ (* stx-for-default new-share) u10000)
      stx-for-direct
    )
  )
)

(define-public (calculate-inflow-pool (pool principal) (new-stx-stacking uint))
  (let (
    (pool-list (list-30-principal pool))

    ;; TODO: should be param
    ;; (total-stx-for-pool (calculate-stx-for-pool pool new-stx-stacking))

    (total-stx-for-pool-list (list-30-uint total-stx-for-pool))
    (delegates (contract-call? .data-pools-v1 get-pool-delegates pool))
  )
    (try! (contract-call? .dao check-is-protocol contract-caller))

    ;; TODO: check for errors
    (map calculate-inflow-delegate delegates pool-list total-stx-for-pool-list)

    (ok true)
  )
)

;;
;; TODO: would be nice if pool owner can decide how to distribute the 10 delegates?? 
;;

(define-public (calculate-inflow-delegate (delegate principal) (pool principal) (total-stx-for-pool uint))
  (let (
    (delegate-share (contract-call? .data-pools-v1 get-delegate-share delegate))
    (total-stx-for-delegate (/ (* total-stx-for-pool delegate-share) u10000))
  )
    (try! (contract-call? .dao check-is-protocol contract-caller))

    (map-set inflow-delegate-amount delegate total-stx-for-delegate)
    (map-set inflow-delegate-pool delegate pool)

    (print { action: "calculate-inflow-delegate", data: { pool: pool, delegate: delegate, stx-for-delegate: total-stx-for-delegate, block-height: block-height } })

    (ok true)
  )
)

;;-------------------------------------
;; Helpers
;;-------------------------------------

(define-read-only (list-30-uint (item uint)) 
  (list item item item item item item item item item item item item item item item item item item item item item item item item item item item item item item)
)

(define-read-only (list-30-principal (item principal)) 
  (list item item item item item item item item item item item item item item item item item item item item item item item item item item item item item item)
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
    { outflow: outflow, inflow: inflow }
  )
)
