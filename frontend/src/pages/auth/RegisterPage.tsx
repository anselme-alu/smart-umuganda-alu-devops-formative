import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import type { Location } from "../../types";
import api from "../../api/client";
import axios from "axios";

interface LocationLevels {
  province: string;
  district: string;
  sector: string;
  cell: string;
  village: string;
}

const EMPTY_LEVELS: LocationLevels = {
  province: "",
  district: "",
  sector: "",
  cell: "",
  village: "",
};

function LocationSelect({
  label,
  value,
  options,
  disabled,
  loading,
  onChange,
}: {
  label: string;
  value: string;
  options: Location[];
  disabled: boolean;
  loading: boolean;
  onChange: (id: string) => void;
}) {
  return (
    <fieldset className="fieldset">
      <legend className="fieldset-legend capitalize">{label}</legend>
      <select
        className="select select-bordered w-full"
        value={value}
        disabled={disabled || loading}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">
          {loading
            ? "Loading…"
            : disabled
              ? `Select ${label.slice(0, -1)} first`
              : `Select ${label}`}
        </option>
        {options.map((loc) => (
          <option key={loc.id} value={loc.id}>
            {loc.name}
          </option>
        ))}
      </select>
    </fieldset>
  );
}

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [selected, setSelected] = useState<LocationLevels>(EMPTY_LEVELS);
  const [provinces, setProvinces] = useState<Location[]>([]);
  const [districts, setDistricts] = useState<Location[]>([]);
  const [sectors, setSectors] = useState<Location[]>([]);
  const [cells, setCells] = useState<Location[]>([]);
  const [villages, setVillages] = useState<Location[]>([]);
  const [provincesLoading, setProvincesLoading] = useState(false);

  useEffect(() => {
    if (step !== 2) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProvincesLoading(true);
    api
      .get<Location[]>("/locations", { params: { type: "province" } })
      .then((res) => setProvinces(res.data))
      .catch(() => setProvinces([]))
      .finally(() => setProvincesLoading(false));
  }, [step]);

  useEffect(() => {
    if (!selected.province) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDistricts([]);
      return;
    }
    api
      .get<Location[]>("/locations", {
        params: { type: "district", parentId: selected.province },
      })
      .then((res) => setDistricts(res.data))
      .catch(() => setDistricts([]));
  }, [selected.province]);

  useEffect(() => {
    if (!selected.district) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSectors([]);
      return;
    }
    api
      .get<Location[]>("/locations", {
        params: { type: "sector", parentId: selected.district },
      })
      .then((res) => setSectors(res.data))
      .catch(() => setSectors([]));
  }, [selected.district]);

  useEffect(() => {
    if (!selected.sector) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCells([]);
      return;
    }
    api
      .get<Location[]>("/locations", {
        params: { type: "cell", parentId: selected.sector },
      })
      .then((res) => setCells(res.data))
      .catch(() => setCells([]));
  }, [selected.sector]);

  useEffect(() => {
    if (!selected.cell) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVillages([]);
      return;
    }
    api
      .get<Location[]>("/locations", {
        params: { type: "village", parentId: selected.cell },
      })
      .then((res) => setVillages(res.data))
      .catch(() => setVillages([]));
  }, [selected.cell]);

  const handleLevelChange = (level: keyof LocationLevels, value: string) => {
    setSelected((prev) => {
      const next = { ...prev, [level]: value };
      if (level === "province") {
        next.district = "";
        next.sector = "";
        next.cell = "";
        next.village = "";
      } else if (level === "district") {
        next.sector = "";
        next.cell = "";
        next.village = "";
      } else if (level === "sector") {
        next.cell = "";
        next.village = "";
      } else if (level === "cell") {
        next.village = "";
      }
      return next;
    });
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setStep(2);
  };

  const handleRegister = async (locationId?: string) => {
    setError("");
    setIsLoading(true);
    try {
      await register(form.name, form.email, form.password, locationId);
      navigate("/dashboard");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.error ?? "Registration failed. Please try again.",
        );
      } else {
        setError("An unexpected error occurred.");
      }
      setStep(1);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 px-4 py-8">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="text-center mb-4">
            <h1 className="text-3xl font-bold text-primary">Smart Umuganda</h1>
            <p className="text-base-content/60 mt-1">
              {step === 1 ? "Create your account" : "Choose your location"}
            </p>
          </div>

          <ul className="steps steps-horizontal w-full mb-6">
            <li className="step step-primary">Account</li>
            <li className={`step ${step === 2 ? "step-primary" : ""}`}>
              Location
            </li>
          </ul>

          {error && (
            <div role="alert" className="alert alert-error mb-2">
              <span>{error}</span>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleStep1Submit} className="space-y-4">
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Full Name</legend>
                <input
                  id="name"
                  type="text"
                  placeholder="Jean de Dieu Nkurunziza"
                  className="input input-bordered w-full"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                  minLength={2}
                  autoComplete="name"
                />
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">Email</legend>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="input input-bordered w-full"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  required
                  autoComplete="email"
                />
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">Password</legend>
                <input
                  id="password"
                  type="password"
                  placeholder="Minimum 8 characters"
                  className="input input-bordered w-full"
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">Confirm Password</legend>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repeat your password"
                  className="input input-bordered w-full"
                  value={form.confirmPassword}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, confirmPassword: e.target.value }))
                  }
                  required
                  autoComplete="new-password"
                />
              </fieldset>

              <button type="submit" className="btn btn-primary w-full mt-2">
                Next &rarr;
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-base-content/60">
                Select your location from province down to your village. This
                helps connect you with your local community.
              </p>

              <LocationSelect
                label="Province"
                value={selected.province}
                options={provinces}
                disabled={false}
                loading={provincesLoading}
                onChange={(v) => handleLevelChange("province", v)}
              />
              <LocationSelect
                label="District"
                value={selected.district}
                options={districts}
                disabled={!selected.province}
                loading={false}
                onChange={(v) => handleLevelChange("district", v)}
              />
              <LocationSelect
                label="Sector"
                value={selected.sector}
                options={sectors}
                disabled={!selected.district}
                loading={false}
                onChange={(v) => handleLevelChange("sector", v)}
              />
              <LocationSelect
                label="Cell"
                value={selected.cell}
                options={cells}
                disabled={!selected.sector}
                loading={false}
                onChange={(v) => handleLevelChange("cell", v)}
              />
              <LocationSelect
                label="Village"
                value={selected.village}
                options={villages}
                disabled={!selected.cell}
                loading={false}
                onChange={(v) => handleLevelChange("village", v)}
              />

              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setStep(1)}
                  disabled={isLoading}
                >
                  &larr; Back
                </button>
                <button
                  type="button"
                  className="btn btn-outline flex-1"
                  onClick={() => handleRegister()}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : (
                    "Skip for now"
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-primary flex-1"
                  onClick={() => handleRegister(selected.village)}
                  disabled={isLoading || !selected.village}
                >
                  {isLoading ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : (
                    "Complete"
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="text-center mt-4 text-sm">
            <span className="text-base-content/60">
              Already have an account?{" "}
            </span>
            <Link to="/auth/login" className="link link-primary font-medium">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
