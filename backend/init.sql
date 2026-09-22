CREATE TABLE IF NOT EXISTS soci (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT,
    cognome TEXT,
    email TEXT,
    telefono TEXT,
    indirizzo TEXT,
    data_iscrizione TEXT
);

CREATE TABLE IF NOT EXISTS ricevute (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    persona_id INTEGER,
    tipo TEXT,
    importo REAL,
    data TEXT,
    descrizione TEXT
);

CREATE TABLE IF NOT EXISTS quote (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    socio_id INTEGER,
    anno INTEGER,
    importo REAL,
    pagata INTEGER
);

CREATE TABLE IF NOT EXISTS movimenti (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo TEXT,
    importo REAL,
    descrizione TEXT,
    data TEXT
);

CREATE TABLE IF NOT EXISTS documenti (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT,
    categoria TEXT,
    file_path TEXT,
    data_caricamento TEXT
);

CREATE TABLE IF NOT EXISTS calendario (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titolo TEXT,
    descrizione TEXT,
    data TEXT
);

CREATE TABLE IF NOT EXISTS notifiche (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titolo TEXT,
    messaggio TEXT,
    categoria TEXT,
    data TEXT,
    letta INTEGER
);

CREATE TABLE IF NOT EXISTS impostazioni (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome_associazione TEXT,
    email TEXT,
    telefono TEXT,
    indirizzo TEXT,
    sede_legale TEXT,
    sede_operativa TEXT,
    iban TEXT,
    logo_url TEXT
);

CREATE TABLE IF NOT EXISTS profilo (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT,
    email TEXT,
    telefono TEXT,
    ruolo TEXT,
    password TEXT,
    avatar_url TEXT
);
