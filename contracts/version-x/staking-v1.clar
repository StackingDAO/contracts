;; @contract Staking
;; @version 1
;;
;; Stake sDAO to get part of protocol revenue
;; Rewards are distributed across all stakers, according to their size in the pool
;;
;; Rewards will be automatically staked before staking or unstaking. 
;; The cumm reward per stake represents the rewards over time, taking into account total staking volume over time
;; When total stake changes, the cumm reward per stake is increased accordingly.

(impl-trait .staking-trait-v1.staking-trait)
(use-trait ft-trait .sip-010-trait-ft-standard.sip-010-trait)

;;-------------------------------------
;; Constants 
;;-------------------------------------

(define-constant ERR_REWARDS_CALC (err u12001))
(define-constant ERR_WRONG_TOKEN (err u12002))
(define-constant ERR_INSUFFICIENT_STAKE (err u12003))

;;-------------------------------------
;; Variables 
;;-------------------------------------

(define-data-var total-staked uint u0)
(define-data-var cumm-reward-per-stake uint u0)
(define-data-var last-reward-increase-block uint u0) 
(define-data-var rewards-per-block uint u0)
(define-data-var rewards-end-block uint u0)

;;-------------------------------------
;; Maps
;;-------------------------------------

;; Keep track of total amount staked and last cumm reward per stake
(define-map stakes 
   { staker: principal } 
   {
      amount: uint,  ;; micro diko amount staked
      cumm-reward-per-stake: uint
   }
)

;;-------------------------------------
;; Getters
;;-------------------------------------

(define-read-only (get-stake-of (staker principal))
  (default-to
    { amount: u0, cumm-reward-per-stake: u0 }
    (map-get? stakes { staker: staker })
  )
)

;; Get stake info - amount staked
(define-read-only (get-stake-amount-of (staker principal))
  (get amount (get-stake-of staker))
)

;; Get stake info - last rewards block
(define-read-only (get-stake-cumm-reward-per-stake-of (staker principal))
  (get cumm-reward-per-stake (get-stake-of staker))
)

;; Get variable total-staked
(define-read-only (get-total-staked)
  (var-get total-staked)
)

;; Get variable cumm-reward-per-stake
(define-read-only (get-cumm-reward-per-stake)
  (var-get cumm-reward-per-stake)
)

;; Get variable last-reward-increase-block
(define-read-only (get-last-reward-increase-block)
  (var-get last-reward-increase-block)
)

;; Get current rewards per block
(define-read-only (get-rewards-per-block)
  (var-get rewards-per-block)
)

;; Get current rewards end block
(define-read-only (get-rewards-end-block)
  (var-get rewards-end-block)
)

;;-------------------------------------
;; Stake / Unstake
;;-------------------------------------

(define-public (stake (token <ft-trait>) (amount uint))
  (let (
    (staker tx-sender)
  )
    (try! (contract-call? .dao check-is-enabled))
    (asserts! (is-eq .sdao-token (contract-of token)) ERR_WRONG_TOKEN)

    (let (
      ;; Calculate new stake amount
      (stake-amount (get-stake-amount-of staker))
      (new-stake-amount (+ stake-amount amount))
    )
      ;; Claim all pending rewards for staker so we can set the new cumm-reward for this user
      ;; Save currrent cumm reward per stake
      (try! (claim-pending-rewards))

      ;; Update total stake
      (var-set total-staked (+ (var-get total-staked) amount))

      ;; Update cumm reward per stake now that total is updated
      (unwrap-panic (increase-cumm-reward-per-stake))

      ;; Transfer token to this contract
      (try! (contract-call? .sdao-token transfer amount staker (as-contract tx-sender) none))

      ;; Update sender stake info
      (map-set stakes { staker: staker } { amount: new-stake-amount, cumm-reward-per-stake: (var-get cumm-reward-per-stake) })

      (ok amount)
    )
  )
)

(define-public (unstake (token <ft-trait>) (amount uint))
  (let (
    (staker tx-sender)
    ;; Staked amount of staker
    (stake-amount (get-stake-amount-of staker))
  )
    (try! (contract-call? .dao check-is-enabled))
    (asserts! (is-eq .sdao-token (contract-of token)) ERR_WRONG_TOKEN)
    (asserts! (>= stake-amount amount) ERR_INSUFFICIENT_STAKE)

    (let (
      ;; Calculate new stake amount
      (new-stake-amount (- stake-amount amount))
    )
      ;; Claim all pending rewards for staker so we can set the new cumm-reward for this user
      ;; Save currrent cumm reward per stake
      (try! (claim-pending-rewards))

      ;; Update total stake
      (var-set total-staked (- (var-get total-staked) amount))

      ;; Update cumm reward per stake now that total is updated
      (unwrap-panic (increase-cumm-reward-per-stake))

      ;; Transfer token back from this contract to the user
      (try! (as-contract (contract-call? .sdao-token transfer amount tx-sender staker none)))

      ;; Update sender stake info
      (map-set stakes { staker: staker } { amount: new-stake-amount, cumm-reward-per-stake: (var-get cumm-reward-per-stake) })

      (ok amount)
    )
  )
)

;;-------------------------------------
;; Rewards - User
;;-------------------------------------

(define-public (get-pending-rewards (staker principal))
  (let (
    (stake-amount (get-stake-amount-of staker))
    (amount-owed-per-token (- (unwrap-panic (calculate-cumm-reward-per-stake)) (get-stake-cumm-reward-per-stake-of staker)))
    (rewards (/ (* stake-amount amount-owed-per-token) u100000000000000))
  )
    (ok rewards)
  )
)

(define-public (claim-pending-rewards)
  (let (
    (staker tx-sender)
  )
    (try! (contract-call? .dao check-is-enabled))
    (unwrap-panic (increase-cumm-reward-per-stake))

    (let (
      (pending-rewards (unwrap! (get-pending-rewards staker) ERR_REWARDS_CALC))
      (stake-of (get-stake-of staker))
    )
      ;; Only mint if enough pending rewards and amount is positive
      (if (>= pending-rewards u1)
        (begin
          ;; Send STX rewards to staker
          (try! (as-contract (stx-transfer? pending-rewards tx-sender staker)))

          (map-set stakes { staker: staker } (merge stake-of { cumm-reward-per-stake: (var-get cumm-reward-per-stake) }))

          (ok pending-rewards)
        )
        (ok u0)
      )
    )
  )
)

;;-------------------------------------
;; Rewards - Tracking
;;-------------------------------------

(define-public (increase-cumm-reward-per-stake)
  (let (
    ;; Calculate new cumm reward per stake
    (new-cumm-reward-per-stake (unwrap-panic (calculate-cumm-reward-per-stake)))
  )
    (asserts! (> burn-block-height (var-get last-reward-increase-block)) (ok u0))

    (var-set cumm-reward-per-stake new-cumm-reward-per-stake)
    (var-set last-reward-increase-block burn-block-height)
    (ok new-cumm-reward-per-stake)
  )
)

(define-public (calculate-cumm-reward-per-stake)
  (let (
    (current-total-staked (var-get total-staked))

    (block-diff 
      ;; If burn-block-height not bigger than last-reward-increase-block, there is nothing to add
      (if (> burn-block-height (var-get last-reward-increase-block))

        ;; If burn-block-height has not reached rewards-end-block
        (if (< burn-block-height (var-get rewards-end-block))
          (- burn-block-height (var-get last-reward-increase-block))

          ;; Once burn-block-height reached rewards-end-block
          (if (< (var-get last-reward-increase-block) (var-get rewards-end-block))
            (- (var-get rewards-end-block) (var-get last-reward-increase-block))
            u0
          )
        )
        u0
      )
    )
    
    (current-cumm-reward-per-stake (var-get cumm-reward-per-stake)) 
  )
    (if (> current-total-staked u0)
      (let (
        (total-rewards-to-distribute (* (var-get rewards-per-block) block-diff))
        (reward-added-per-token (/ (* total-rewards-to-distribute u100000000000000) current-total-staked))
        (new-cumm-reward-per-stake (+ current-cumm-reward-per-stake reward-added-per-token))
      )
        (ok new-cumm-reward-per-stake)
      )
      (ok current-cumm-reward-per-stake)
    )
  )
)

;;-------------------------------------
;; Rewards - Add
;;-------------------------------------

;; Used by the commission contract to add STX
(define-public (add-rewards (amount uint) (end-block uint))
  (let (
    ;; Get rewards not distributed yet
    (reward-blocks-left (if (< burn-block-height (var-get rewards-end-block))
      (- (var-get rewards-end-block) burn-block-height)
      u0
    ))
    (rewards-left (* reward-blocks-left (var-get rewards-per-block)))

    ;; Calculate new reward per block
    (new-rewards-per-block (/ (+ rewards-left amount) (- end-block burn-block-height)))
  )
    (try! (contract-call? .dao check-is-protocol contract-caller))

    ;; Increase cummulative rewards per stake first
    (unwrap-panic (increase-cumm-reward-per-stake))

    ;; Get STX
    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))

    ;; Update rewards per block and rewards end block
    (var-set rewards-per-block new-rewards-per-block)
    (var-set rewards-end-block end-block)

    (ok amount)
  )
)

;;-------------------------------------
;; Init
;;-------------------------------------

(begin
  (var-set last-reward-increase-block burn-block-height)
)
