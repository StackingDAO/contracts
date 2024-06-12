;; @contract Strategy V3 Pools V1
;; @version 1
;;
;; Calculates amount of STX to stack per pool, while taking into account direct stacking.
;; When a user selects a pool to direct stack, the STX will be stacked in that pool. However,
;; all pool rewards are aggregated and distributed across all stSTX holders to allow for token
;; fungibility. 
;; That's why there's also a part of normal stacking STX that will be divided across pools, 
;; according to the direct stacking ratios.

;;-------------------------------------
;; Constants 
;;-------------------------------------

(define-constant DENOMINATOR_BPS u10000)

;;-------------------------------------
;; Core
;;-------------------------------------

(define-read-only (calculate-stacking-per-pool)
  (let (
    (new-amounts (calculate-new-amounts))
  )
    (calculate-reach-target (get new-total-direct-stacking new-amounts) (get new-total-normal-stacking new-amounts))
  )
)

;;-------------------------------------
;; New amounts
;;-------------------------------------

(define-read-only (calculate-new-amounts)
  (let (
    ;; Currently stacking
    (total-stacking (unwrap-panic (contract-call? .reserve-v1 get-stx-stacking)))

    ;; New total amount to stack
    (total-idle (unwrap-panic (contract-call? .reserve-v1 get-stx-balance)))
    (total-withdrawals (unwrap-panic (contract-call? .reserve-v1 get-stx-for-withdrawals)))
    (new-total-stacking (- (+ total-stacking total-idle) total-withdrawals))

    ;; New total amount to stack, for normal and direct
    (new-total-direct-stacking (contract-call? .data-direct-stacking-v1 get-total-direct-stacking))
    (new-total-normal-stacking (- (+ total-stacking total-idle) total-withdrawals new-total-direct-stacking))
  )
    { 
      new-total-direct-stacking: new-total-direct-stacking, 
      new-total-normal-stacking: new-total-normal-stacking, 
      inflow: (if (> new-total-stacking total-stacking)
        (- new-total-stacking total-stacking)
        u0
      ),
      outflow: (if (> total-stacking new-total-stacking)
        (- total-stacking new-total-stacking )
        u0
      ) 
    } 
  )
)

;;-------------------------------------
;; Pool target
;;-------------------------------------

(define-read-only (calculate-reach-target (new-total-direct-stacking uint) (new-total-normal-stacking uint))
  (let (
    (pools (contract-call? .data-pools-v1 get-active-pools))

    (new-total-normal-stacking-list (list-30-uint new-total-normal-stacking))
    (new-total-direct-stacking-list (list-30-uint new-total-direct-stacking))

    (targets (map calculate-stacking-target-for-pool pools new-total-normal-stacking-list new-total-direct-stacking-list))
    (locked (map calculate-locked-for-pool pools))

    (stacking-amounts (contract-call? .strategy-v3-algo-v1 calculate-reach-target targets locked))
  )
    (map map-pool-stacking-amount pools stacking-amounts)
  )
)

(define-read-only (map-pool-stacking-amount (pool principal) (stacking-amount uint))
  { pool: pool, stacking-amount: stacking-amount }
)

(define-read-only (calculate-stacking-target-for-pool (pool principal) (new-total-normal-stacking uint) (new-total-direct-stacking uint))
  (let (
    (direct-stacking (contract-call? .data-direct-stacking-v1 get-direct-stacking-pool-amount pool))
    (direct-stacking-share (if (is-eq new-total-direct-stacking u0)
      u0
      (/ (* direct-stacking DENOMINATOR_BPS) new-total-direct-stacking)
    ))
    (pool-share (contract-call? .data-pools-v1 get-pool-share pool))
    
    (direct-dependence (if (is-eq new-total-direct-stacking u0)
      u0
      (contract-call? .data-direct-stacking-v1 get-direct-stacking-dependence)
    )) 
    (direct-dependence-rest (- DENOMINATOR_BPS direct-dependence))

    (total-normal-stacking (/ (* new-total-normal-stacking direct-dependence-rest) DENOMINATOR_BPS))
    (total-normal-direct-stacking (/ (* new-total-normal-stacking direct-dependence) DENOMINATOR_BPS))

    (normal-stacking (/ (* total-normal-stacking pool-share) DENOMINATOR_BPS))
    (normal-direct-stacking (/ (* total-normal-direct-stacking direct-stacking-share) DENOMINATOR_BPS))
  )
    (+ direct-stacking normal-stacking normal-direct-stacking)
  )
)

;;-------------------------------------
;; Pool locked
;;-------------------------------------

(define-read-only (calculate-locked-for-pool (pool principal))
  (let (
    (delegates (contract-call? .data-pools-v1 get-pool-delegates pool))
  )
    (fold + (map get-locked-stx delegates) u0)
  )
)

;;-------------------------------------
;; Helpers
;;-------------------------------------

(define-read-only (list-30-uint (item uint)) 
  (list item item item item item item item item item item item item item item item item item item item item item item item item item item item item item item)
)

(define-read-only (get-locked-stx (account principal))
  (get locked (get-stx-account account))
)

(define-read-only (get-stx-account (account principal))
  (if is-in-mainnet
    (stx-account account)
    (contract-call? .pox-4-mock stx-account-mock account)
  )
)
