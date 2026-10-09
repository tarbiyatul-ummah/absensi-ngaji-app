import React, { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Guru, Jilid, SantriType } from "@/types";
import { useTerms } from "@/config/organization";

export interface SantriFormPayload {
  nama: string;
  jilidId: string;
  guruId: string;
  tipeId?: string;
  tanggalLahir?: string;
  tanggalMasuk?: string;
}

export interface SantriFormProps {
  jilidList: Jilid[];
  guruList: Guru[];
  tipeList: SantriType[];
  variant?: "card" | "plain";
  onSubmit: (data: SantriFormPayload) => void;
  onCancel?: () => void;
}

export const SantriForm: React.FC<SantriFormProps> = ({
  jilidList,
  guruList,
  tipeList,
  variant = "card",
  onSubmit,
}) => {
  const terms = useTerms();
  const [inputNama, setInputNama] = useState("");
  const [selectedJilid, setSelectedJilid] = useState("");
  const [selectedGuru, setSelectedGuru] = useState("");
  const [selectedTipe, setSelectedTipe] = useState("");
  const [selectedTanggalLahir, setSelectedTanggalLahir] = useState("");
  const [selectedTanggalMasuk, setSelectedTanggalMasuk] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputNama.trim() || !selectedJilid || !selectedGuru) {
      alert("Lengkapi data terlebih dahulu");
      return;
    }

    onSubmit({
      nama: inputNama.trim(),
      jilidId: selectedJilid,
      guruId: selectedGuru,
      tipeId: selectedTipe || undefined,
      tanggalLahir: selectedTanggalLahir || undefined,
      tanggalMasuk: selectedTanggalMasuk || undefined,
    });

    setInputNama("");
    setSelectedTanggalLahir("");
    setSelectedTanggalMasuk(new Date().toISOString().slice(0, 10));
  };

  const formContent = (
    <div className={variant === "plain" ? "space-y-4" : "space-y-4 p-4"}>
      <div>
        <Label htmlFor="santri-names-input">
          Nama {terms.studentSingularTitle}
        </Label>
        <Textarea
          id="santri-names-input"
          value={inputNama}
          onChange={(e) => setInputNama(e.target.value)}
          placeholder="Pisahkan dengan koma (contoh: Budi, Andi)"
          rows={2}
        />
      </div>

      <div className="flex gap-3">
        <div className="w-full">
          <Label htmlFor="santri-jilid-select">
            {terms.levelSingularTitle}
          </Label>
          <Select
            value={selectedJilid}
            onValueChange={(val) => setSelectedJilid(val)}
          >
            <SelectTrigger id="santri-jilid-select" className="h-9 w-full">
              <SelectValue placeholder={`Pilih ${terms.levelSingularTitle}`} />
            </SelectTrigger>
            <SelectContent>
              {jilidList.map((jilid) => (
                <SelectItem key={jilid.id} value={jilid.id}>
                  {jilid.nama}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full">
          <Label htmlFor="santri-guru-select">
            {terms.mentorSingularTitle}
          </Label>
          <Select
            value={selectedGuru}
            onValueChange={(val) => setSelectedGuru(val)}
          >
            <SelectTrigger id="santri-guru-select" className="h-9 w-full">
              <SelectValue placeholder={`Pilih ${terms.mentorSingularTitle}`} />
            </SelectTrigger>
            <SelectContent>
              {guruList.map((guru) => (
                <SelectItem key={guru.id} value={guru.id}>
                  {guru.nama}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="santri-tipe-select">
          Tipe {terms.studentSingularTitle}
        </Label>
        <Select
          value={selectedTipe || "none"}
          onValueChange={(val) => setSelectedTipe(val === "none" ? "" : val)}
        >
          <SelectTrigger id="santri-tipe-select" className="h-9 w-full">
            <SelectValue placeholder="Tanpa tipe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Tanpa tipe</SelectItem>
            {tipeList.map((tipe) => (
              <SelectItem key={tipe.id} value={tipe.id}>
                {tipe.nama}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label htmlFor="santri-entrydate-input">Tanggal Masuk</Label>
          <input
            id="santri-entrydate-input"
            value={selectedTanggalMasuk}
            onChange={(e) => setSelectedTanggalMasuk(e.target.value)}
            type="date"
            className="ui-input"
          />
        </div>

        <div>
          <Label htmlFor="santri-birthdate-input">Tanggal Lahir</Label>
          <input
            id="santri-birthdate-input"
            value={selectedTanggalLahir}
            onChange={(e) => setSelectedTanggalLahir(e.target.value)}
            type="date"
            className="ui-input"
          />
        </div>
      </div>

      <div className="pt-2">
        <Button type="submit" className="w-full md:w-auto">
          <HugeiconsIcon
            icon={PlusSignIcon}
            size={17}
            color="currentColor"
            strokeWidth={2}
          />
          Simpan Data
        </Button>
      </div>
    </div>
  );

  if (variant === "plain") {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        {formContent}
      </form>
    );
  }

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b py-4">
        <CardTitle>Tambah {terms.studentSingularTitle} Baru</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>{formContent}</form>
    </Card>
  );
};

export default SantriForm;

