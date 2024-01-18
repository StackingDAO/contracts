;; @contract Governance V0
;; @version 0

;;-------------------------------------
;; Core 
;;-------------------------------------

(define-public (set-commission (new-commission uint))
  (begin
    (try! (contract-call? .dao check-is-protocol tx-sender))
    (as-contract (contract-call? .stacking-dao-core-v1 set-commission new-commission))
  )
)
