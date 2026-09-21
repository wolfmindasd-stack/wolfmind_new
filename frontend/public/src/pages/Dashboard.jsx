export default function Dashboard() {
  const { user } = useAuth();
  const [d, setD] = useState(null);

  useEffect(() => {
    api
      .get("/api/dashboard")   // <── CORRETTO
      .then((r) => setD(r.data))
      .catch(() => {});
  }, []);

  if (!d) return <div className="text-white/50">Caricamento…</div>;

  const isTecnico = user?.role === "tecnico";

  return (
    <div className="space-y-8" data-testid="dashboard-page">
      {/* resto del componente */}
    </div>
  );
}
