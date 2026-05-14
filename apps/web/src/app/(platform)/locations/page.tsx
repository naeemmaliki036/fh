"use client";

import { useState } from "react";
import { MapPin, Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAdminCountries, useAdminCities, useAdminAreas } from "@/hooks/queries/useLocations";
import {
  useCreateCountry, useUpdateCountry, useDeleteCountry,
  useCreateCity, useUpdateCity, useDeleteCity,
  useCreateArea, useUpdateArea, useDeleteArea,
  useBulkCreateAreas,
} from "@/hooks/mutations/useLocationMutations";
import type { CountryWithCounts, City, Area } from "@/lib/types/location";

function toSlug(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function QuickForm({ title, fields, onSave, onClose, isPending }: {
  title: string;
  fields: { name: string; label: string; value: string; onChange: (v: string) => void }[];
  onSave: () => void; onClose: () => void; isPending: boolean;
}): React.ReactElement {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-xl bg-card p-6 shadow-xl space-y-4">
        <h3 className="font-semibold">{title}</h3>
        {fields.map((f) => (
          <div key={f.name} className="space-y-1">
            <Label>{f.label}</Label>
            <Input value={f.value} onChange={(e) => f.onChange(e.target.value)} />
          </div>
        ))}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={onSave} disabled={isPending}>{isPending ? "Saving..." : "Save"}</Button>
        </div>
      </div>
    </div>
  );
}

function BulkPasteModal({ cityId, onClose }: { cityId: string; onClose: () => void }): React.ReactElement {
  const [text, setText] = useState("");
  const bulk = useBulkCreateAreas(cityId);
  const submit = (): void => {
    const items = text.split("\n").map((l) => l.trim()).filter(Boolean).map((lbl) => ({ slug: toSlug(lbl), label: lbl }));
    if (!items.length) return;
    bulk.mutate({ city_id: cityId, items }, { onSuccess: onClose });
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-xl bg-card p-6 shadow-xl space-y-4">
        <h3 className="font-semibold">Bulk paste areas</h3>
        <p className="text-xs text-muted-foreground">One area name per line. Slugs auto-generated.</p>
        <textarea className="w-full rounded-md border bg-background p-2 text-sm font-mono h-40 resize-none focus:outline-none"
          value={text} onChange={(e) => setText(e.target.value)} placeholder={"Dubai Marina\nBusiness Bay"} />
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={submit} disabled={bulk.isPending}>{bulk.isPending ? "Importing..." : "Import"}</Button>
        </div>
      </div>
    </div>
  );
}

// Country row with per-row mutation instances
function CountryRow({ c, selected, onSelect, onEdit, onDeleted }: {
  c: CountryWithCounts; selected: boolean;
  onSelect: () => void; onEdit: () => void; onDeleted: () => void;
}): React.ReactElement {
  const update = useUpdateCountry(c.id);
  const del = useDeleteCountry();
  return (
    <button type="button" onClick={onSelect}
      className={`w-full text-left rounded-md border px-3 py-2 text-sm hover:bg-accent transition-colors ${selected ? "bg-accent" : ""}`}>
      <div className="flex items-center gap-2">
        <span>{c.flag_emoji}</span>
        <span className="flex-1 font-medium">{c.name}</span>
        <span className="text-xs text-muted-foreground">{c.city_count}c / {c.area_count}a</span>
        <button type="button" onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="text-muted-foreground hover:text-foreground"><Pencil className="h-3 w-3" /></button>
        <button type="button" onClick={(e) => { e.stopPropagation(); update.mutate({ active: !c.active }); }}
          className="text-muted-foreground hover:text-foreground">
          {c.active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
        </button>
        <button type="button" onClick={(e) => { e.stopPropagation(); del.mutate(c.id, { onSuccess: onDeleted }); }}
          className="text-destructive hover:opacity-80"><Trash2 className="h-3 w-3" /></button>
      </div>
      {!c.active && <Badge variant="outline" className="text-[10px] mt-0.5">inactive</Badge>}
    </button>
  );
}

// City row with per-row mutation instances
function CityRow({ city, countryId, selected, onSelect, onEdit }: {
  city: City; countryId: string; selected: boolean;
  onSelect: () => void; onEdit: () => void;
}): React.ReactElement {
  const update = useUpdateCity(city.id, countryId);
  const del = useDeleteCity(countryId);
  return (
    <button type="button" onClick={onSelect}
      className={`w-full text-left rounded-md border px-3 py-2 text-sm hover:bg-accent transition-colors ${selected ? "bg-accent" : ""}`}>
      <div className="flex items-center gap-2">
        <span className="flex-1">{city.label}</span>
        {!city.active && <Badge variant="outline" className="text-xs">inactive</Badge>}
        <button type="button" onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="text-muted-foreground hover:text-foreground"><Pencil className="h-3 w-3" /></button>
        <button type="button" onClick={(e) => { e.stopPropagation(); update.mutate({ active: !city.active }); }}
          className="text-muted-foreground hover:text-foreground">
          {city.active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
        </button>
        <button type="button" onClick={(e) => { e.stopPropagation(); del.mutate(city.id); }}
          className="text-destructive hover:opacity-80"><Trash2 className="h-3 w-3" /></button>
      </div>
    </button>
  );
}

// Area row with per-row mutations
function AreaRow({ area, cityId, onEdit }: { area: Area; cityId: string; onEdit: () => void }): React.ReactElement {
  const update = useUpdateArea(area.id, cityId);
  const del = useDeleteArea(cityId);
  return (
    <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
      <span className="flex-1 truncate">{area.label}</span>
      {!area.active && <Badge variant="outline" className="text-xs">inactive</Badge>}
      <button type="button" onClick={() => update.mutate({ active: !area.active })} className="text-muted-foreground hover:text-foreground">
        {area.active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
      </button>
      <button type="button" onClick={onEdit} className="text-muted-foreground hover:text-foreground"><Pencil className="h-4 w-4" /></button>
      <button type="button" onClick={() => del.mutate(area.id)} className="text-destructive hover:opacity-80"><Trash2 className="h-4 w-4" /></button>
    </div>
  );
}

function AreasColumn({ city }: { city: City }): React.ReactElement {
  const { data: areas = [], isLoading } = useAdminAreas(city.id);
  const create = useCreateArea(city.id);
  const [adding, setAdding] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [editLabel, setEditLabel] = useState("");
  const [showBulk, setShowBulk] = useState(false);
  const updateArea = useUpdateArea(editingArea?.id ?? "", city.id);
  return (
    <div className="flex flex-col gap-3 min-w-0">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Areas — {city.label}</h2>
        <div className="flex gap-1">
          <Button size="sm" variant="outline" onClick={() => setShowBulk(true)}>Bulk</Button>
          <Button size="sm" onClick={() => setAdding(true)}><Plus className="h-3 w-3 mr-1" />Add</Button>
        </div>
      </div>
      {isLoading && <p className="text-xs text-muted-foreground">Loading...</p>}
      <div className="space-y-1 overflow-y-auto max-h-[60vh]">
        {areas.map((a) => (
          <AreaRow key={a.id} area={a} cityId={city.id} onEdit={() => { setEditingArea(a); setEditLabel(a.label); }} />
        ))}
      </div>
      {adding && (
        <QuickForm title="Add area"
          fields={[{ name: "label", label: "Label", value: newLabel, onChange: setNewLabel }]}
          onSave={() => { create.mutate({ slug: toSlug(newLabel), label: newLabel.trim() }, { onSuccess: () => { setAdding(false); setNewLabel(""); } }); }}
          onClose={() => setAdding(false)} isPending={create.isPending} />
      )}
      {editingArea && (
        <QuickForm title="Edit area"
          fields={[{ name: "label", label: "Label", value: editLabel, onChange: setEditLabel }]}
          onSave={() => updateArea.mutate({ label: editLabel.trim() }, { onSuccess: () => setEditingArea(null) })}
          onClose={() => setEditingArea(null)} isPending={updateArea.isPending} />
      )}
      {showBulk && <BulkPasteModal cityId={city.id} onClose={() => setShowBulk(false)} />}
    </div>
  );
}

export default function LocationsPage(): React.ReactElement {
  const { data: countries = [], isLoading: loadingCountries } = useAdminCountries();
  const [selectedCountry, setSelectedCountry] = useState<CountryWithCounts | null>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const { data: cities = [], isLoading: loadingCities } = useAdminCities(selectedCountry?.id);
  const createCountry = useCreateCountry();
  const [addingCountry, setAddingCountry] = useState(false);
  const [editingCountry, setEditingCountry] = useState<CountryWithCounts | null>(null);
  const [newCtCode, setNewCtCode] = useState("");
  const [newCtName, setNewCtName] = useState("");
  const [editCtName, setEditCtName] = useState("");
  const updateEditingCountry = useUpdateCountry(editingCountry?.id ?? "");
  const createCity = useCreateCity(selectedCountry?.id ?? "");
  const [addingCity, setAddingCity] = useState(false);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [newCityLabel, setNewCityLabel] = useState("");
  const [editCityLabel, setEditCityLabel] = useState("");
  const updateEditingCity = useUpdateCity(editingCity?.id ?? "", selectedCountry?.id ?? "");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MapPin className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-semibold tracking-tight">Location Management</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Countries */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Countries</h2>
            <Button size="sm" onClick={() => setAddingCountry(true)}><Plus className="h-3 w-3 mr-1" />Add</Button>
          </div>
          {loadingCountries && <p className="text-xs text-muted-foreground">Loading...</p>}
          <div className="space-y-1">
            {countries.map((c) => (
              <CountryRow key={c.id} c={c} selected={selectedCountry?.id === c.id}
                onSelect={() => { setSelectedCountry(c); setSelectedCity(null); }}
                onEdit={() => { setEditingCountry(c); setEditCtName(c.name); }}
                onDeleted={() => { if (selectedCountry?.id === c.id) setSelectedCountry(null); }} />
            ))}
          </div>
        </div>
        {/* Cities */}
        <div className="flex flex-col gap-3">
          {selectedCountry ? (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Cities — {selectedCountry.name}</h2>
                <Button size="sm" onClick={() => setAddingCity(true)}><Plus className="h-3 w-3 mr-1" />Add</Button>
              </div>
              {loadingCities && <p className="text-xs text-muted-foreground">Loading...</p>}
              <div className="space-y-1">
                {cities.map((city) => (
                  <CityRow key={city.id} city={city} countryId={selectedCountry.id}
                    selected={selectedCity?.id === city.id}
                    onSelect={() => setSelectedCity(city)}
                    onEdit={() => { setEditingCity(city); setEditCityLabel(city.label); }} />
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Select a country to view cities</p>
          )}
        </div>
        {/* Areas */}
        <div>
          {selectedCity
            ? <AreasColumn city={selectedCity} />
            : <p className="text-sm text-muted-foreground">Select a city to view areas</p>}
        </div>
      </div>
      {addingCountry && (
        <QuickForm title="Add country"
          fields={[
            { name: "code", label: "ISO code (e.g. AE)", value: newCtCode, onChange: setNewCtCode },
            { name: "name", label: "Name", value: newCtName, onChange: setNewCtName },
          ]}
          onSave={() => { createCountry.mutate({ code: newCtCode.toUpperCase(), name: newCtName }, { onSuccess: () => { setAddingCountry(false); setNewCtCode(""); setNewCtName(""); } }); }}
          onClose={() => setAddingCountry(false)} isPending={createCountry.isPending} />
      )}
      {editingCountry && (
        <QuickForm title="Edit country"
          fields={[{ name: "name", label: "Name", value: editCtName, onChange: setEditCtName }]}
          onSave={() => { updateEditingCountry.mutate({ name: editCtName }, { onSuccess: () => setEditingCountry(null) }); }}
          onClose={() => setEditingCountry(null)} isPending={updateEditingCountry.isPending} />
      )}
      {addingCity && selectedCountry && (
        <QuickForm title="Add city"
          fields={[{ name: "label", label: "Label", value: newCityLabel, onChange: setNewCityLabel }]}
          onSave={() => { createCity.mutate({ slug: toSlug(newCityLabel), label: newCityLabel.trim() }, { onSuccess: () => { setAddingCity(false); setNewCityLabel(""); } }); }}
          onClose={() => setAddingCity(false)} isPending={createCity.isPending} />
      )}
      {editingCity && selectedCountry && (
        <QuickForm title="Edit city"
          fields={[{ name: "label", label: "Label", value: editCityLabel, onChange: setEditCityLabel }]}
          onSave={() => { updateEditingCity.mutate({ label: editCityLabel.trim() }, { onSuccess: () => setEditingCity(null) }); }}
          onClose={() => setEditingCity(null)} isPending={updateEditingCity.isPending} />
      )}
    </div>
  );
}
