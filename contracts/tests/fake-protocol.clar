;; @contract Supported Protocol - Fake
;; @version 1

(impl-trait .protocol-trait-v1.protocol-trait)

;; Public method in case we can not use read-only
(define-public (get-balance (user principal))
  (ok u1000000000000)
)
