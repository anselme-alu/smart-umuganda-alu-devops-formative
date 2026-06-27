import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import axios from "axios";
import api from "../../api/client";
import Layout from "../../components/Layout";
import type { Location, LocationType } from "../../types/index";
import { LOCATION_TYPES, PARENT_TYPE } from "../../types/index";

const typeBadgeClass: Record<LocationType, string> = {
  province: "badge-neutral",
  district: "badge-primary",
  sector: "badge-secondary",
  cell: "badge-accent",
  village: "badge-info",
};

interface LocationForm {
  name: string;
  type: LocationType;
  parentId: string;
}

const defaultForm: LocationForm = { name: "", type: "province", parentId: "" };

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<LocationType>("province");
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Location | null>(null);
  const [form, setForm] = useState<LocationForm>(defaultForm);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchLocations = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await api.get<Location[]>("/locations");
      setLocations(res.data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error ?? "Failed to load locations.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLocations();
  }, [fetchLocations]);

  const openCreate = () => {
    setEditTarget(null);
    setForm({ ...defaultForm, type: activeTab });
    setFormError("");
    setShowModal(true);
  };

  const openEdit = (loc: Location) => {
    setEditTarget(loc);
    setForm({ name: loc.name, type: loc.type, parentId: loc.parentId ?? "" });
    setFormError("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditTarget(null);
    setForm(defaultForm);
  };

  const getParentOptions = (type: LocationType) => {
    const parentType = PARENT_TYPE[type];
    if (!parentType) return [];
    return locations.filter((l) => l.type === parentType);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setIsSaving(true);
    try {
      if (editTarget) {
        await api.patch(`/locations/${editTarget.id}`, {
          name: form.name,
          parentId: form.parentId || null,
        });
      } else {
        await api.post("/locations", {
          name: form.name,
          type: form.type,
          parentId: form.parentId || undefined,
        });
      }
      closeModal();
      await fetchLocations();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setFormError(err.response?.data?.error ?? "Failed to save location.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/locations/${deleteId}`);
      setDeleteId(null);
      await fetchLocations();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error ?? "Delete failed.");
      }
    }
  };

  const getParentName = (parentId: string | null) => {
    if (!parentId) return "—";
    return locations.find((l) => l.id === parentId)?.name ?? "—";
  };

  const filtered = locations.filter((l) => l.type === activeTab);
  const parentType = PARENT_TYPE[form.type];
  const parentOptions = getParentOptions(form.type);

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold">Location Management</h1>
          <button className="btn btn-primary btn-sm gap-1" onClick={openCreate}>
            <Plus size={16} /> Add Location
          </button>
        </div>

        {error && (
          <div role="alert" className="alert alert-error">
            <span>{error}</span>
            <button
              className="btn btn-sm btn-ghost btn-square"
              onClick={() => setError("")}
            >
              <X size={14} />
            </button>
          </div>
        )}

        <div className="tabs tabs-boxed">
          {LOCATION_TYPES.map((type) => (
            <button
              key={type}
              className={`tab capitalize ${activeTab === type ? "tab-active" : ""}`}
              onClick={() => setActiveTab(type)}
            >
              {type}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-base-300">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Parent</th>
                  <th>Created</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center py-8 text-base-content/50"
                    >
                      No {activeTab}s found. Click &quot;Add Location&quot; to
                      create one.
                    </td>
                  </tr>
                )}
                {filtered.map((loc) => (
                  <tr key={loc.id}>
                    <td className="font-medium">{loc.name}</td>
                    <td>
                      <span className={`badge ${typeBadgeClass[loc.type]}`}>
                        {loc.type}
                      </span>
                    </td>
                    <td className="text-base-content/60">
                      {getParentName(loc.parentId)}
                    </td>
                    <td className="text-sm text-base-content/60">
                      {new Date(loc.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <button
                          className="btn btn-xs btn-ghost btn-square"
                          title="Edit"
                          onClick={() => openEdit(loc)}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className="btn btn-xs btn-ghost btn-square text-error"
                          title="Delete"
                          onClick={() => setDeleteId(loc.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">
              {editTarget ? `Edit ${editTarget.name}` : "Add Location"}
            </h3>

            {formError && (
              <div role="alert" className="alert alert-error mb-4 text-sm">
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              {!editTarget && (
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Type</legend>
                  <select
                    id="locType"
                    className="select select-bordered w-full"
                    value={form.type}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        type: e.target.value as LocationType,
                        parentId: "",
                      }))
                    }
                  >
                    {LOCATION_TYPES.map((t) => (
                      <option key={t} value={t} className="capitalize">
                        {t}
                      </option>
                    ))}
                  </select>
                </fieldset>
              )}

              <fieldset className="fieldset">
                <legend className="fieldset-legend">Name</legend>
                <input
                  id="locName"
                  type="text"
                  className="input input-bordered w-full"
                  placeholder={`Enter ${form.type} name`}
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                  minLength={2}
                />
              </fieldset>

              {parentType && (
                <fieldset className="fieldset">
                  <legend className="fieldset-legend capitalize">
                    Parent {parentType}
                  </legend>
                  <select
                    id="locParent"
                    className="select select-bordered w-full"
                    value={form.parentId}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, parentId: e.target.value }))
                    }
                    required={!!parentType}
                  >
                    <option value="">— Select {parentType} —</option>
                    {parentOptions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  {parentOptions.length === 0 && (
                    <p className="label text-warning">
                      No {parentType}s found. Create a {parentType} first.
                    </p>
                  )}
                </fieldset>
              )}

              <div className="modal-action">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : (
                    "Save"
                  )}
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop" onClick={closeModal} />
        </div>
      )}

      {deleteId && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Confirm Delete</h3>
            <p className="py-4">
              Delete this location? Child locations referencing it cannot be
              deleted if they still have dependents.
            </p>
            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={() => setDeleteId(null)}
              >
                Cancel
              </button>
              <button className="btn btn-error" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setDeleteId(null)} />
        </div>
      )}
    </Layout>
  );
}
