;; @contract Rewards Job
;; @version 1
;;
;; Stacking rewards are received after the cycle ends, and swapped to STX.
;; The STX is added to this contract. At the end of the current cycle, the STX will be added to the protocol.

(impl-trait 'SP3C0TCQS0C0YY8E0V3EJ7V4X9571885D44M8EFWF.arkadiko-automation-trait-v1.automation-trait)

;;-------------------------------------
;; Variables
;;-------------------------------------

(define-constant ERR_SHOULD_NOT_HANDLE u31001)

;;-------------------------------------
;; Arkadiko Keeper functions
;;-------------------------------------

(define-public (initialize)
  (ok true)
)

(define-read-only (check-job)
  (let (
    (stx-balance (stx-get-balance (as-contract tx-sender)))
    (current-cycle (contract-call? .stacking-dao-core-v1 get-pox-cycle))
    (next-withdraw-cycle (contract-call? .stacking-dao-core-v1 get-next-withdraw-cycle))

    (balance-not-zero (> stx-balance u0))
    (end-of-cycle (> next-withdraw-cycle (+ current-cycle u1)))
  )
    (if (and balance-not-zero end-of-cycle)
      (ok true)
      (ok false)
    )
  )
)

(define-public (run-job)
  (let (
    (stx-balance (stx-get-balance (as-contract tx-sender)))
    (current-cycle (contract-call? .stacking-dao-core-v1 get-pox-cycle))
  )
    (asserts! (unwrap-panic (check-job)) (err ERR_SHOULD_NOT_HANDLE))

    (try! (as-contract (contract-call? .stacking-dao-core-v1 add-rewards .commission-v1 .staking-v1 .reserve-v1 stx-balance current-cycle)))

    (ok true)
  )
)

;;-------------------------------------
;; Admin 
;;-------------------------------------

(define-public (retreive-stx-tokens (requested-stx uint) (receiver principal))
  (begin
    (try! (contract-call? .dao check-is-protocol tx-sender))

    (try! (as-contract (stx-transfer? requested-stx tx-sender receiver)))
    (ok requested-stx)
  )
)
