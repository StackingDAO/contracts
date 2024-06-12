;; @contract Stacking Pool Payout
;; @version 1
;;
;; Add stacking pool rewards and distribute across all delegates

;;-------------------------------------
;; Constants
;;-------------------------------------

(define-constant ERR_BLOCK_INFO u2015001)
(define-constant ERR_POOL_CYCLE_INDEX u2015002)
(define-constant ERR_REWARD_SET u2015003)
(define-constant ERR_TOTAL_STACKED u2015004)
(define-constant ERR_STACKER_INFO u2015005)

;;-------------------------------------
;; Variables
;;-------------------------------------

(define-data-var last-reward-id uint u0)
(define-data-var stacking-pool principal .stacking-pool-v1)

;;-------------------------------------
;; Maps
;;-------------------------------------

(define-map rewards-info 
  uint 
  {
    cycle: uint,
    amount: uint,
    amount-distributed: uint,
    total-stacked: uint
  }
)

(define-map user-distributed 
  {
    user: principal,
    rewards-id: uint
  }
  bool
)

;;-------------------------------------
;; Getters
;;-------------------------------------

(define-read-only (get-last-reward-id)
  (var-get last-reward-id)
)

(define-read-only (get-stacking-pool)
  (var-get stacking-pool)
)

(define-read-only (get-rewards-info (rewards-id uint))
  (default-to
    {
      cycle: u0,
      amount: u0,
      amount-distributed: u0,
      total-stacked: u0
    }
    (map-get? rewards-info rewards-id)
  )
)

(define-read-only (get-user-distributed (user principal) (rewards-id uint))
  (default-to
    false
    (map-get? user-distributed { user: user, rewards-id: rewards-id })
  )
)

;;-------------------------------------
;; Getters
;;-------------------------------------

(define-read-only (get-total-stacked (cycle uint))
  (let (
    (reward-index (unwrap! (contract-call? .stacking-pool-v1 get-cycle-to-index cycle) (err ERR_POOL_CYCLE_INDEX)))
    (reward-set (unwrap! (get-reward-set-pox-address cycle reward-index) (err ERR_REWARD_SET)))
  )
    (ok (get total-ustx reward-set))
  )
)

(define-read-only (get-user-stacked (user principal) (cycle uint))
  (let (
    (block (+ (reward-cycle-to-burn-height cycle) u1))
    (block-hash (unwrap! (get-block-info? id-header-hash block) (err ERR_BLOCK_INFO)))
    (stacker-info (unwrap! (at-block block-hash (get-stacker-info user)) (err ERR_STACKER_INFO)))
  )
    (if (and (is-some (get delegated-to stacker-info)) (is-eq (unwrap-panic (get delegated-to stacker-info)) (get-stacking-pool)))
      (ok (get locked (at-block block-hash (get-stx-account user))))
      (ok u0)
    )
  )
)

;;-------------------------------------
;; Core
;;-------------------------------------

(define-public (deposit-rewards (amount uint) (cycle uint))
  (let (
    (reward-id (var-get last-reward-id))
    (total-stacked (unwrap! (get-total-stacked cycle) (err ERR_TOTAL_STACKED)))
  )
    (map-insert rewards-info reward-id { cycle: cycle, amount: amount, amount-distributed: u0, total-stacked: total-stacked })

    (var-set last-reward-id (+ reward-id u1))

    (stx-transfer? amount tx-sender (as-contract tx-sender))
  )
)

(define-public (distribute-rewards (users (list 200 principal)) (reward-id uint))
  (let (
    (reward-id-list (list reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id  reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id reward-id))

    (distribute-result (map distribute-rewards-helper users reward-id-list))
    (distribute-errors (filter is-error distribute-result))
    (distribute-error (element-at? distribute-errors u0))
  )
    (asserts! (is-eq distribute-error none) (unwrap-panic distribute-error))

    (let (
      (distributed-total (fold + (map unwrap distribute-result) u0))
      (rewards (get-rewards-info reward-id))
    )
      (map-set rewards-info reward-id (merge rewards { amount-distributed: (+ (get amount-distributed rewards) distributed-total) }))
      (ok distributed-total)
    )
  )
)

(define-private (distribute-rewards-helper (user principal) (reward-id uint))
  (let (
    (rewards (get-rewards-info reward-id))
    (user-stacked (try! (get-user-stacked user (get cycle rewards))))
    (user-rewards (/ (* user-stacked (get amount rewards)) (get total-stacked rewards)))
  )
    (if (get-user-distributed user reward-id)
      (ok u0)
      (begin
        (try! (as-contract (stx-transfer? user-rewards tx-sender user)))
        (map-set user-distributed { user: user, rewards-id: reward-id } true)
        (ok user-rewards)
      )
    )
  )
)

(define-read-only (is-error (response (response uint uint)))
  (is-err response)
)

(define-read-only (unwrap (response (response uint uint)))
  (unwrap-panic response)
)

;;-------------------------------------
;; Admin
;;-------------------------------------

(define-public (set-stacking-pool (pool principal))
  (begin
    (try! (contract-call? .dao check-is-protocol contract-caller))

    (var-set stacking-pool pool)
    (ok true)
  )
)

(define-public (get-stx (requested-stx uint) (receiver principal))
  (begin
    (try! (contract-call? .dao check-is-protocol contract-caller))

    (try! (as-contract (stx-transfer? requested-stx tx-sender receiver)))
    (ok requested-stx)
  )
)

;;-------------------------------------
;; PoX Helpers
;;-------------------------------------

(define-read-only (get-stx-account (account principal))
  (if is-in-mainnet
    (stx-account account)
    (contract-call? .pox-4-mock stx-account-mock account)
  )
)

(define-read-only (reward-cycle-to-burn-height (cycle-id uint)) 
  (if is-in-mainnet
    (contract-call? 'SP000000000000000000002Q6VF78.pox-4 reward-cycle-to-burn-height cycle-id)
    (contract-call? .pox-4-mock reward-cycle-to-burn-height cycle-id)
  )
)

(define-read-only (get-reward-set-pox-address (cycle-id uint) (reward-index uint)) 
  (if is-in-mainnet
    (contract-call? 'SP000000000000000000002Q6VF78.pox-4 get-reward-set-pox-address cycle-id reward-index)
    (contract-call? .pox-4-mock get-reward-set-pox-address cycle-id reward-index)
  )
)

(define-read-only (get-stacker-info (delegate principal)) 
  (if is-in-mainnet
    (contract-call? 'SP000000000000000000002Q6VF78.pox-4 get-stacker-info delegate)
    (contract-call? .pox-4-mock get-stacker-info delegate)
  )
)   
