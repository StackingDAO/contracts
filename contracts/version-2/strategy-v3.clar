;; @contract Stacking Strategy
;; @version 3
;;
;; This is the main strategy to perform stacking each cycle:
;; 1) prepare-pools - to save the amount of STX to stack per pool
;; 2) prepare-delegates - to save the amount of STX to stack per delegate for given pool
;; 3) execute - actual delegation to pools
;; 4) return-unlocked-stx - return excess STX in delegates back to reserve
;;
;; This process can only be performed in the last blocks (withdraw offset) of a cycle.
;; The process can only be performed once per cycle.

(use-trait stacking-delegate-trait .stacking-delegate-trait-v1.stacking-delegate-trait)
(use-trait reserve-trait .reserve-trait-v1.reserve-trait)
(use-trait rewards-trait .rewards-trait-v1.rewards-trait)

;;-------------------------------------
;; Constants 
;;-------------------------------------

(define-constant ERR_WRONG_DELEGATE_TRAIT u206001)
(define-constant ERR_CAN_NOT_PREPARE u206002)
(define-constant ERR_NOT_PREPARED_YET u206003)
(define-constant ERR_HAS_ALREADY_PREPARED u206004)
(define-constant ERR_HAS_EXECUTED u206005)

;;-------------------------------------
;; Variables 
;;-------------------------------------

(define-data-var cycle-prepared-pools uint u0)

;;-------------------------------------
;; Maps
;;-------------------------------------

(define-map prepare-pools-data
  principal
  {
    stacking-amount: uint,

    cycle-prepared-pool: uint,
    cycle-prepared-delegates: uint,
    cycle-executed-pool: uint
  }
)

(define-map prepare-delegates-data
  principal
  {
    stacking-amount: uint,
  }
)

;;-------------------------------------
;; Getters
;;-------------------------------------

(define-read-only (get-cycle-prepared-pools)
  (var-get cycle-prepared-pools)
)

(define-read-only (get-prepare-pools-data (pool principal))
  (default-to
    {
      stacking-amount: u0,
      cycle-prepared-pool: u0,
      cycle-prepared-delegates: u0,
      cycle-executed-pool: u0
    }
    (map-get? prepare-pools-data pool)
  )
)

(define-read-only (get-prepare-delegates-data (delegate principal))
  (default-to
    {
      stacking-amount: u0,
    }
    (map-get? prepare-delegates-data delegate)
  )
)

(define-read-only (can-prepare) 
  (let (
    (start-block-next-cycle (reward-cycle-to-burn-height (+ (get-pox-cycle) u1)))
    (withdrawal-offset (contract-call? .data-core-v1 get-cycle-withdraw-offset))
  )
    (> burn-block-height (- start-block-next-cycle withdrawal-offset))
  )
)

(define-read-only (has-prepared-pools) 
  (>= (get-cycle-prepared-pools) (get-pox-cycle))
)

(define-read-only (has-prepared-delegates (pool principal)) 
  (>= (get cycle-prepared-delegates (get-prepare-pools-data pool)) (get-pox-cycle))
)

(define-read-only (has-executed-pool (pool principal)) 
  (>= (get cycle-executed-pool (get-prepare-pools-data pool)) (get-pox-cycle))
)


;;-------------------------------------
;; Step 1: prepare pools
;;-------------------------------------

(define-public (prepare-pools)
  (let (
    (pox-cycle (get-pox-cycle))
    (pox-cycle-list (list-30-uint pox-cycle))
    (stacking-per-pool (contract-call? .strategy-v3-pools-v1 calculate-stacking-per-pool))
  )
    (try! (contract-call? .dao check-is-enabled))
    (asserts! (can-prepare) (err ERR_CAN_NOT_PREPARE))
    (asserts! (not (has-prepared-pools)) (err ERR_HAS_ALREADY_PREPARED))

    (map map-pool-stacking-amount pox-cycle-list stacking-per-pool)

    (var-set cycle-prepared-pools pox-cycle)

    (print { action: "prepare-pools", cycle-prepared-pools: pox-cycle, block-height: block-height })
    (ok true)
  )
)

(define-private (map-pool-stacking-amount (pox-cycle uint) (info { pool: principal, stacking-amount: uint }))
  (begin
    (print { action: "map-pool-stacking-amount", pool: (get pool info), stacking-amount: (get stacking-amount info), block-height: block-height })
    (map-set prepare-pools-data (get pool info) (merge (get-prepare-pools-data (get pool info)) { stacking-amount: (get stacking-amount info), cycle-prepared-pool: pox-cycle }))
  )
)

;;-------------------------------------
;; Step 2: prepare pool delegates
;;-------------------------------------

(define-public (prepare-delegates (pool principal))
  (let (
    (pox-cycle (get-pox-cycle))
    (pool-info (get-prepare-pools-data pool))
    (stacking-per-delegate (contract-call? .strategy-v3-delegates-v1 calculate-stacking-per-delegate pool (get stacking-amount pool-info)))
  )
    (try! (contract-call? .dao check-is-enabled))
    (asserts! (can-prepare) (err ERR_CAN_NOT_PREPARE))
    (asserts! (has-prepared-pools) (err ERR_NOT_PREPARED_YET))
    (asserts! (not (has-prepared-delegates pool)) (err ERR_HAS_ALREADY_PREPARED))

    (map map-delegate-stacking-amount stacking-per-delegate)

    (map-set prepare-pools-data pool (merge pool-info { cycle-prepared-delegates: pox-cycle }))

    (print { action: "prepare-delegates", pool: pool, cycle-prepared-delegates: pox-cycle, block-height: block-height })
    (ok true)
  )
)

(define-private (map-delegate-stacking-amount (info { delegate: principal, stacking-amount: uint }))
  (begin
    (print { action: "map-delegate-stacking-amount", delegate: (get delegate info), stacking-amount: (get stacking-amount info), block-height: block-height })
    (map-set prepare-delegates-data (get delegate info) { stacking-amount: (get stacking-amount info) })
  )
)

;;-------------------------------------
;; Step 3: execute stacking for  pool
;;-------------------------------------

(define-public (execute (pool principal) (delegates (list 30 <stacking-delegate-trait>)) (reserve <reserve-trait>) (rewards-contract <rewards-trait>))
  (let (
    (pox-cycle (get-pox-cycle))
    (saved-delegates (contract-call? .data-pools-v1 get-pool-delegates pool))
    (compare-errors (filter not (map compare-delegates saved-delegates delegates)))

    (helper-result (map perform-pool-delegation-helper delegates (list-30-principal pool) (list-30-uint (get-unlock-burn-height)) (list-30-reserve-trait reserve) (list-30-rewards-trait rewards-contract)))
    (helper-errors (filter is-error helper-result))
    (helper-error (element-at? helper-errors u0))
  )
    (try! (contract-call? .dao check-is-enabled))
    (try! (contract-call? .dao check-is-protocol (contract-of reserve)))
    (try! (contract-call? .dao check-is-protocol (contract-of rewards-contract)))

    (asserts! (can-prepare) (err ERR_CAN_NOT_PREPARE))
    (asserts! (has-prepared-delegates pool) (err ERR_NOT_PREPARED_YET))
    (asserts! (not (has-executed-pool pool)) (err ERR_HAS_EXECUTED))

    (asserts! (is-eq (len compare-errors) u0) (err ERR_WRONG_DELEGATE_TRAIT))
    (asserts! (is-eq (len delegates) (len saved-delegates)) (err ERR_WRONG_DELEGATE_TRAIT))
    (asserts! (is-eq helper-error none) (unwrap-panic helper-error))

    (map-set prepare-pools-data pool (merge (get-prepare-pools-data pool) { cycle-executed-pool: pox-cycle }))

    (print { action: "execute", pool: pool, cycle-executed-pool: pox-cycle, block-height: block-height })
    (ok true)
  )
)

(define-read-only (compare-delegates (saved-delegate principal) (delegate <stacking-delegate-trait>))
  (is-eq saved-delegate (contract-of delegate))
)

(define-private (perform-pool-delegation-helper (delegate <stacking-delegate-trait>) (delegate-to principal) (until-burn-ht uint) (reserve <reserve-trait>) (rewards-contract <rewards-trait>))
  (let (
    (delegate-info (get-prepare-delegates-data (contract-of delegate)))
    (amount (get stacking-amount delegate-info))
  )
    (print { action: "perform-pool-delegation-helper", delegate: delegate, delegate-to: delegate-to, until-burn-ht: until-burn-ht, amount: amount, block-height: block-height })

    (if (is-eq amount u0)
      (contract-call? .delegates-handler-v1 revoke delegate reserve rewards-contract)
      (contract-call? .delegates-handler-v1 revoke-and-delegate delegate reserve rewards-contract amount delegate-to until-burn-ht)
    )
  )
)

;;-------------------------------------
;; Step 4: return unlocked STX to reserve
;;-------------------------------------

(define-public (return-unlocked-stx (delegates (list 30 <stacking-delegate-trait>)) (reserve <reserve-trait>))
  (ok (map return-unlocked-stx-helper delegates (list-30-reserve-trait reserve)))
)

(define-private (return-unlocked-stx-helper (delegate <stacking-delegate-trait>) (reserve <reserve-trait>))
  (contract-call? .delegates-handler-v1 handle-excess delegate reserve)
)

;;-------------------------------------
;; PoX Helpers
;;-------------------------------------

(define-read-only (get-pox-cycle)
  (if is-in-mainnet
    (contract-call? 'SP000000000000000000002Q6VF78.pox-4 current-pox-reward-cycle)
    (contract-call? .pox-4-mock current-pox-reward-cycle)
  )
)

(define-read-only (reward-cycle-to-burn-height (cycle-id uint)) 
  (if is-in-mainnet
    (contract-call? 'SP000000000000000000002Q6VF78.pox-4 reward-cycle-to-burn-height cycle-id)
    (contract-call? .pox-4-mock reward-cycle-to-burn-height cycle-id)
  )
)

(define-read-only (get-unlock-burn-height)
  (reward-cycle-to-burn-height (+ (get-pox-cycle) u2))
)

;;-------------------------------------
;; Helpers
;;-------------------------------------

(define-read-only (is-error (response (response bool uint)))
  (is-err response)
)

(define-read-only (list-30-uint (item uint)) 
  (list item item item item item item item item item item item item item item item item item item item item item item item item item item item item item item)
)

(define-read-only (list-30-principal (item principal)) 
  (list item item item item item item item item item item item item item item item item item item item item item item item item item item item item item item)
)

(define-read-only (list-30-reserve-trait (item <reserve-trait>)) 
  (list item item item item item item item item item item item item item item item item item item item item item item item item item item item item item item)
)

(define-read-only (list-30-rewards-trait (item <rewards-trait>)) 
  (list item item item item item item item item item item item item item item item item item item item item item item item item item item item item item item)
)

