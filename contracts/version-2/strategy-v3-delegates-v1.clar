;; @contract Strategy V3 Delegates V1
;; @version 1
;;
;; Calculate delegation amounts for given pool.
;; If there is an inflow, use the reach-target algorithm to calculate stacking amounts per delegate.
;; If there is an outflow, use lowest-combination algorithm to calculate which delegates to stop

;;-------------------------------------
;; Constants 
;;-------------------------------------

(define-constant DENOMINATOR_BPS u10000)

;;-------------------------------------
;; Core
;;-------------------------------------

(define-read-only (calculate-stacking-per-delegate (pool principal) (total-to-stack uint))
  (let (
    (locked (calculate-locked-for-pool pool))
  )
    (if (>= total-to-stack locked)
      (calculate-inflow pool total-to-stack)
      (calculate-outflow pool total-to-stack (- locked total-to-stack))
    )
  )
)

(define-read-only (map-delegate-stacking-amount (delegate principal) (stacking-amount uint))
  { delegate: delegate, stacking-amount: stacking-amount }
)

;;-------------------------------------
;; Inflow
;;-------------------------------------

(define-read-only (calculate-inflow (pool principal) (total-to-stack uint))
  (let (
    (delegates (contract-call? .data-pools-v1 get-pool-delegates pool))
    (targets (map calculate-stacking-target-for-delegate delegates (list-30-uint total-to-stack)))
    (locked (map get-locked-stx delegates))
    (stacking-amounts (contract-call? .strategy-v3-algo-v1 calculate-reach-target targets locked))
  )
    (map map-delegate-stacking-amount delegates stacking-amounts)
  )
)

(define-read-only (calculate-stacking-target-for-delegate (delegate principal) (total-to-stack uint))
  (let (
    (delegate-share (contract-call? .data-pools-v1 get-delegate-share delegate))
  )
    (/ (* total-to-stack delegate-share) DENOMINATOR_BPS)
  )
)

;;-------------------------------------
;; Outflow
;;-------------------------------------

(define-read-only (calculate-outflow (pool principal) (total-to-stack uint) (outflow uint))
  (let (
    (delegates (contract-call? .data-pools-v1 get-pool-delegates pool))
    (locked (map get-locked-stx delegates))
    (stacking-amounts (contract-call? .strategy-v3-algo-v1 calculate-lowest-combination outflow locked))
  )
    (map map-delegate-stacking-amount delegates stacking-amounts)
  )
)

;;-------------------------------------
;; Locked
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
