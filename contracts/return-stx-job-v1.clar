;; @contract Return STX Job
;; @version 1
;;
;; When a stacker is stopped, the STX will be returned to the stacker contract.
;; This job makes sure the STX is transferred from the stacker contract to the reserve.

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
    (stackers (list .stacker-1 .stacker-2 .stacker-3 .stacker-4 .stacker-5 .stacker-6 .stacker-7 .stacker-8 .stacker-9 .stacker-10))
    (stx-balance (fold + (map stx-get-balance stackers) u0))
  )
    (if (> stx-balance u0)
      (ok true)
      (ok false)
    )
  )
)

(define-public (run-job)
  (begin
    (asserts! (unwrap-panic (check-job)) (err ERR_SHOULD_NOT_HANDLE))

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
