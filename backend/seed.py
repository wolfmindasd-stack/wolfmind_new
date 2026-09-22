from models import SessionLocal, Profilo, Impostazioni

db = SessionLocal()

# Profilo admin
if not db.query(Profilo).first():
    admin = Profilo(
        nome="Admin",
        email="admin@example.com",
        telefono="0000000000",
        ruolo="admin",
        password="admin",
        avatar_url=""
    )
    db.add(admin)

# Impostazioni base
if not db.query(Impostazioni).first():
    imp = Impostazioni(
        nome_associazione="Associazione WolfMind",
        email="info@wolfmind.it",
        telefono="0000000000",
        indirizzo="",
        sede_legale="",
        sede_operativa="",
        iban="",
        logo_url=""
    )
    db.add(imp)

db.commit()
print("Seed completato.")
