;; @contract Commission stSTXbtc
;; @version 1
;;
;; Part of the stacking rewards are captured as commission.
;; The commission can be split between the protocol and stakers.

(impl-trait .commission-trait-v1.commission-trait)
(use-trait staking-trait .staking-trait-v1.staking-trait)

;;-------------------------------------
;; Constants 
;;-------------------------------------

(define-constant DENOMINATOR_BPS u10000)

;;-------------------------------------
;; Variables 
;;-------------------------------------

(define-data-var staking-basispoints uint u0) ;; 0% in basis points, set later

;;-------------------------------------
;; Getters 
;;-------------------------------------

(define-read-only (get-staking-basispoints)
  (var-get staking-basispoints)
)

;;-------------------------------------
;; Helpers 
;;-------------------------------------

;; Adding rewards for cycle X happens at the end of cycle X+1
;; These rewards are distributed per block during cycle X+2,
;; and the distribution ends at the end of cycle X+2 plus pox-prepare-length
(define-read-only (get-cycle-rewards-end-block) 
  (let (
    (cycle-end-block (reward-cycle-to-burn-height (+ (get-pox-cycle) u2)))
    (pox-prepare-length (get-prepare-cycle-length))
  )
    (+ cycle-end-block pox-prepare-length)
  )
)

;;-------------------------------------
;; Trait 
;;-------------------------------------

;; Used by core contract
;; Commission is split between stakers and protocol
(define-public (add-commission (staking-contract <staking-trait>) (sbtc-amount uint))
  (let (
    (amount-for-staking (/ (* sbtc-amount (get-staking-basispoints)) DENOMINATOR_BPS))
    (amount-to-keep (- sbtc-amount amount-for-staking))
  )
    (try! (contract-call? .dao check-is-protocol (contract-of staking-contract)))

    ;; Send to stakers
    (if (> amount-for-staking u0)
      (try! (contract-call? staking-contract add-rewards amount-for-staking (get-cycle-rewards-end-block)))
      u0    
    )

    ;; Keep in contract
    (if (> amount-to-keep u0)
      ;; TODO: update with mainnet sbtc token
      (try! (contract-call? .sbtc-token transfer amount-to-keep contract-caller (as-contract tx-sender) none))
      false
    )

    (ok sbtc-amount)
  )
)

;;-------------------------------------
;; Get commission 
;;-------------------------------------

(define-public (withdraw-commission (amount uint) (receiver principal))
  (begin
    (try! (contract-call? .dao check-is-protocol contract-caller))

      ;; TODO: update with mainnet sbtc token
    (try! (as-contract (contract-call? .sbtc-token transfer amount tx-sender receiver none)))

    (ok amount)
  )
)

;;-------------------------------------
;; Admin 
;;-------------------------------------

(define-public (set-staking-basispoints (new-basispoints uint))
  (begin
    (try! (contract-call? .dao check-is-protocol tx-sender))

    (var-set staking-basispoints new-basispoints)
    (ok true)
  )
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

(define-read-only (get-prepare-cycle-length)
  (if is-in-mainnet
    (get prepare-cycle-length (unwrap-panic (contract-call? 'SP000000000000000000002Q6VF78.pox-4 get-pox-info)))
    (get prepare-cycle-length (unwrap-panic (contract-call? .pox-4-mock get-pox-info)))
  )
)