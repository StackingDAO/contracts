;; @contract DAO
;; @version 1

;;-------------------------------------
;; Constants 
;;-------------------------------------

(define-constant ERR_NOT_ADMIN u20001)
(define-constant ERR_CONTRACTS_DISABLED u20002)
(define-constant ERR_INACTIVE_CONTRACT u20003)

;;-------------------------------------
;; Variables 
;;-------------------------------------

(define-data-var contracts-enabled bool true)

;;-------------------------------------
;; Maps 
;;-------------------------------------

(define-map contracts
  { 
    address: principal 
  }
  {
    active: bool,
  }
)

(define-map admins
  { 
    address: principal 
  }
  {
    active: bool,
  }
)

;;-------------------------------------
;; Getters 
;;-------------------------------------

(define-read-only (get-contracts-enabled)
  (var-get contracts-enabled)
)

(define-read-only (get-contract-active (address principal))
  (get active 
    (default-to 
      { active: false }
      (map-get? contracts { address: address })
    )
  )
)

(define-read-only (get-admin (address principal))
  (get active 
    (default-to 
      { active: false }
      (map-get? admins { address: address })
    )
  )
)

;;-------------------------------------
;; Checks 
;;-------------------------------------

(define-public (check-is-enabled)
  (begin
    (asserts! (var-get contracts-enabled) (err ERR_CONTRACTS_DISABLED))
    (ok true)
  )
)

(define-public (check-is-protocol (contract principal))
  (begin
    (asserts! (get-contract-active contract) (err ERR_INACTIVE_CONTRACT))
    (ok true)
  )
)

(define-public (check-is-admin (contract principal))
  (begin
    (asserts! (get-admin contract) (err ERR_NOT_ADMIN))
    (ok true)
  )
)

;;-------------------------------------
;; Set 
;;-------------------------------------

(define-public (set-contracts-enabled (enabled bool))
  (begin
    (try! (check-is-admin tx-sender))
    (var-set contracts-enabled enabled)
    (ok true)
  )
)

(define-public (set-contract-active (address principal) (active bool))
  (begin
    (try! (check-is-admin tx-sender))
    (map-set contracts { address: address } { active: active }
  )
    (ok true)
  )
)

(define-public (set-admin (address principal) (active bool))
  (begin
    (try! (check-is-admin tx-sender))
    (map-set admins { address: address } { active: active }
  )
    (ok true)
  )
)

;;-------------------------------------
;; Init 
;;-------------------------------------

(begin
  (map-set admins { address: tx-sender } { active: true })

  (map-set contracts { address: tx-sender } { active: true })

  (map-set contracts { address: .stacking-dao-core-v1 } { active: true })
  (map-set contracts { address: .reserve-v1 } { active: true })
  (map-set contracts { address: .commission-v1 } { active: true })
  (map-set contracts { address: .commission-v2 } { active: true })
  (map-set contracts { address: .tax-v1 } { active: true })
  (map-set contracts { address: .staking-v1 } { active: true })
  (map-set contracts { address: .staking-v0 } { active: true })

  (map-set contracts { address: .stacker-1 } { active: true })
  (map-set contracts { address: .stacker-2 } { active: true })
  (map-set contracts { address: .stacker-3 } { active: true })
  (map-set contracts { address: .stacker-4 } { active: true })
  (map-set contracts { address: .stacker-5 } { active: true })
  (map-set contracts { address: .stacker-6 } { active: true })
  (map-set contracts { address: .stacker-7 } { active: true })
  (map-set contracts { address: .stacker-8 } { active: true })
  (map-set contracts { address: .stacker-9 } { active: true })
  (map-set contracts { address: .stacker-10 } { active: true })

  (map-set contracts { address: .stacking-dao-genesis-nft-minter } { active: true })

  ;; Version 2
  (map-set contracts { address: .stacking-dao-core-v2 } { active: true })
  (map-set contracts { address: .direct-helpers-v1 } { active: true })
  (map-set contracts { address: .stacking-pool-v1 } { active: true })
  (map-set contracts { address: .rewards-v2 } { active: true })
  (map-set contracts { address: .strategy-v4 } { active: true })
  (map-set contracts { address: .strategy-v3 } { active: true })
  (map-set contracts { address: .delegates-handler-v1 } { active: true })

  (map-set contracts { address: .stacking-delegate-1-1 } { active: true })
  (map-set contracts { address: .stacking-delegate-1-2 } { active: true })
  (map-set contracts { address: .stacking-delegate-1-3 } { active: true })

  (map-set contracts { address: .stacking-delegate-2-1 } { active: true })
  (map-set contracts { address: .stacking-delegate-2-2 } { active: true })
  (map-set contracts { address: .stacking-delegate-2-3 } { active: true })

)
