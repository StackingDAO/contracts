;; @contract Supported Protocol - Zest
;; @version 1

(impl-trait .protocol-trait-v1.protocol-trait)

;;-------------------------------------
;; Arkadiko 
;;-------------------------------------

(define-read-only (get-balance (user principal))
  (ok (get-user-balance user))
)

;;-------------------------------------
;; For testing only 
;;-------------------------------------

(define-map user-balance principal uint)

(define-read-only (get-user-balance (user principal))
  (default-to
    u0
    (map-get? user-balance user)
  )
)

(define-public (add-user-balance (balance uint))
  (begin
    (try! (contract-call? .ststx-token transfer balance tx-sender (as-contract tx-sender) none))

    (map-set user-balance tx-sender balance)
    (ok true)
  )
)

(define-public (remove-user-balance (balance uint))
  (let (
    (user tx-sender)
  )
    (try! (as-contract (contract-call? .ststx-token transfer balance tx-sender user none)))

    (map-set user-balance user balance)
    (ok true)
  )
)
