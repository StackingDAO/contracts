;; @contract Supported Position - Mock
;; @version 1

(impl-trait .position-trait-v1.position-trait)

(define-data-var mock-amount-user uint u100000000)
(define-data-var mock-amount-reserve uint u200000000)

(define-read-only (get-holder-balance (user principal))
  (ok (var-get mock-amount-user))
)

(define-read-only (get-reserve-balance)
  (ok (var-get mock-amount-reserve))
)

(define-public (set-mock-amount-user (amount uint)) 
  (begin
    (var-set mock-amount-user amount)
    (ok true)
  )
)

(define-public (set-mock-amount-reserve (amount uint)) 
  (begin
    (var-set mock-amount-reserve amount)
    (ok true)
  )
)
