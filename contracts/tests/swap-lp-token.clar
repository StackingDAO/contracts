;; Bitflow Finance

;;;;;;;;;;;;;;;;;;;;; SIP 010 ;;;;;;;;;;;;;;;;;;;;;;
(impl-trait .sip-010-trait-ft-standard.sip-010-trait)
(use-trait lp-trait 'SPRP7MYBHSMFH5EGN3HGX6KNQ7QBHVTBPCE2RJDH.lp-trait.lp-trait)


(define-fungible-token swap-lp-token)


(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-UNAUTHORIZED-MINT (err u100))
(define-constant ERR-NOT-AUTHORIZED (err u101))

;;vars
(define-data-var token-uri (string-utf8 256) u"")
(define-data-var approved-minter principal .swap)


;; ---------------------------------------------------------
;; SIP-10 Functions
;; ---------------------------------------------------------
(define-read-only (adheres-to-sip-010)
  (ok true)
)

(define-read-only (get-name)
  (ok "Swap-LP-Token")
)

(define-read-only (get-symbol)
  (ok "Swap-LP-Token")
)

(define-read-only (get-decimals)
  (ok u8)
)

(define-read-only (get-balance (account principal))
  (ok (ft-get-balance swap-lp-token account))
)

(define-read-only (get-total-supply)
  (ok (ft-get-supply swap-lp-token))
)


(define-read-only (get-token-uri)
  (ok (some (var-get token-uri)))
)

(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
  (begin
    (asserts! (is-eq tx-sender sender) ERR-NOT-AUTHORIZED)

    (match (ft-transfer? swap-lp-token amount sender recipient)
      response (begin
        (print memo)
        (ok response)
      )
      error (err error)
    )
  )
)

(define-public (mint (who principal) (amount uint))
  (begin
    (asserts! (is-eq contract-caller (var-get approved-minter)) ERR-UNAUTHORIZED-MINT)
    ;; amount & who are unchecked, but we let the contract owner mint to whoever they like for convenience
    ;; #[allow(unchecked_data)]
    (ft-mint? swap-lp-token amount who)
  )
)


(define-public (burn (burner principal) (amount uint))
  (begin
    (asserts! (is-eq tx-sender burner) ERR-NOT-AUTHORIZED)
    (ft-burn? swap-lp-token amount burner)
  )
)

;; Change the minter to any other principal, can only be called the current minter
(define-public (set-minter (who principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (ok (var-set approved-minter who))
  )
)

(define-public (set-token-uri (new-uri (string-utf8 256)))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (ok (var-set token-uri new-uri))
  )
)