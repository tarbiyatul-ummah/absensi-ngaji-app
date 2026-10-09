import React, { useState } from "react";
import { Link } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_FAVICON_URL,
  organizationConfig,
  resetOrganizationConfig,
  saveOrganizationConfig,
  terms,
} from "../config/organization";

export const OrganizationTermsView: React.FC = () => {
  const [showSavedMessage, setShowSavedMessage] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: organizationConfig.name,
    typeLabel: organizationConfig.typeLabel,
    appTitle: organizationConfig.appTitle,
    faviconUrl: organizationConfig.faviconUrl,
    studentSingularTitle: terms.studentSingularTitle,
    mentorSingularTitle: terms.mentorSingularTitle,
    levelSingularTitle: terms.levelSingularTitle,
    paymentLabel: terms.paymentLabel,
  });

  const normalizeLower = (value: string) => value.trim().toLowerCase();
  const normalizeTitle = (value: string) => value.trim();

  const syncEditableConfig = () => {
    setFormData({
      name: organizationConfig.name,
      typeLabel: organizationConfig.typeLabel,
      appTitle: organizationConfig.appTitle,
      faviconUrl: organizationConfig.faviconUrl,
      studentSingularTitle: terms.studentSingularTitle,
      mentorSingularTitle: terms.mentorSingularTitle,
      levelSingularTitle: terms.levelSingularTitle,
      paymentLabel: terms.paymentLabel,
    });
  };

  const showSavedState = () => {
    setShowSavedMessage(true);
    window.setTimeout(() => {
      setShowSavedMessage(false);
    }, 2200);
  };

  const handleFaviconUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError("");
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("File favicon harus berupa gambar.");
      event.target.value = "";
      return;
    }

    if (file.size > 256 * 1024) {
      setUploadError("Ukuran favicon maksimal 256 KB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({
        ...prev,
        faviconUrl: String(reader.result),
      }));
    };
    reader.onerror = () => {
      setUploadError("Favicon gagal dibaca.");
    };
    reader.readAsDataURL(file);
  };

  const resetFavicon = () => {
    setUploadError("");
    setFormData((prev) => ({
      ...prev,
      faviconUrl: DEFAULT_FAVICON_URL,
    }));
  };

  const getSettingsSaveError = (error: unknown) => {
    const message =
      error instanceof Error ? error.message : "Error tidak diketahui.";
    return `Pengaturan gagal disimpan ke akun. Pastikan organization_settings_schema.sql atau schema.sql terbaru sudah dijalankan di Supabase. Detail: ${message}`;
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const studentSingularTitle = normalizeTitle(formData.studentSingularTitle);
    const mentorSingularTitle = normalizeTitle(formData.mentorSingularTitle);
    const levelSingularTitle = normalizeTitle(formData.levelSingularTitle);

    setSaveError("");
    setIsSaving(true);

    try {
      await saveOrganizationConfig({
        name: normalizeTitle(formData.name),
        typeLabel: normalizeTitle(formData.typeLabel),
        appTitle: normalizeTitle(formData.appTitle) || organizationConfig.appTitle,
        faviconUrl: formData.faviconUrl || DEFAULT_FAVICON_URL,
        terms: {
          studentSingularTitle,
          studentSingularLower: normalizeLower(studentSingularTitle),
          mentorSingularTitle,
          mentorSingularLower: normalizeLower(mentorSingularTitle),
          levelSingularTitle,
          levelSingularLower: normalizeLower(levelSingularTitle),
          paymentLabel: normalizeTitle(formData.paymentLabel),
        },
      });

      syncEditableConfig();
      showSavedState();
    } catch (error) {
      setSaveError(getSettingsSaveError(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetSettings = async () => {
    setSaveError("");
    setIsSaving(true);

    try {
      await resetOrganizationConfig();
      syncEditableConfig();
      setUploadError("");
      showSavedState();
    } catch (error) {
      setSaveError(getSettingsSaveError(error));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="app-page">
      <div className="app-container space-y-4">
        <Button asChild variant="ghost" size="sm" className="w-fit px-2">
          <Link to="/akun" className="flex items-center gap-1.5">
            <HugeiconsIcon icon={ArrowLeft02Icon} size={16} strokeWidth={1.7} />
            Akun
          </Link>
        </Button>

        <header className="app-header">
          <div>
            <h1 className="app-title">Edit Pengaturan</h1>
            <p className="app-subtitle">
              Atur identitas organisasi, tampilan browser, dan istilah yang
              dipakai di aplikasi.
            </p>
          </div>
        </header>

        <form className="space-y-4" onSubmit={handleSaveSettings}>
          {showSavedMessage && (
            <Alert className="border-emerald-200 bg-emerald-50 text-emerald-700">
              Pengaturan berhasil disimpan.
            </Alert>
          )}
          {saveError && (
            <Alert variant="destructive" className="block leading-relaxed break-words">
              {saveError}
            </Alert>
          )}
          {uploadError && <Alert variant="destructive">{uploadError}</Alert>}

          <Card className="gap-0 py-0">
            <CardHeader className="border-b py-4">
              <CardTitle>Pengaturan Organisasi</CardTitle>
              <CardDescription>
                Semua pengaturan ini masih dalam satu identitas aplikasi.
              </CardDescription>
            </CardHeader>

            <CardContent className="divide-y p-0">
              <section className="space-y-3 p-4">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    Organisasi
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Nama dan jenis lembaga yang menjadi konteks aplikasi.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Nama Organisasi</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      type="text"
                      placeholder="Contoh: LPQ Tarbiyatul Ummah"
                    />
                  </div>
                  <div>
                    <Label>Label Organisasi</Label>
                    <Input
                      value={formData.typeLabel}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          typeLabel: e.target.value,
                        }))
                      }
                      type="text"
                      placeholder="Contoh: LPQ, Perguruan Silat"
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-3 p-4">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    Tampilan Web
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Mengubah title tab browser dan favicon aplikasi untuk akun
                    ini.
                  </p>
                </div>
                <div>
                  <Label>Title Web</Label>
                  <Input
                    value={formData.appTitle}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        appTitle: e.target.value,
                      }))
                    }
                    type="text"
                    placeholder="Contoh: Absensi Organisasi Saya"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Title ini tampil di tab browser dan hasil bookmark.
                  </p>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={formData.faviconUrl || DEFAULT_FAVICON_URL}
                        alt="Preview favicon"
                        className="h-12 w-12 rounded-lg border bg-muted object-contain p-1"
                      />
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          Favicon
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Pakai gambar persegi, maksimal 256 KB.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:min-w-64">
                      <Input
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml,image/x-icon,image/vnd.microsoft.icon"
                        onChange={handleFaviconUpload}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={resetFavicon}
                      >
                        Pakai Placeholder
                      </Button>
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-3 p-4">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    Bahasa Aplikasi
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Sesuaikan sebutan yang muncul di menu, absensi, keuangan, dan
                    rekap.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Sebutan Peserta</Label>
                    <Input
                      value={formData.studentSingularTitle}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          studentSingularTitle: e.target.value,
                        }))
                      }
                      type="text"
                      placeholder="Contoh: Santri, Siswa, Murid"
                    />
                  </div>
                  <div>
                    <Label>Sebutan Pengajar/Pembina</Label>
                    <Input
                      value={formData.mentorSingularTitle}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          mentorSingularTitle: e.target.value,
                        }))
                      }
                      type="text"
                      placeholder="Contoh: Guru, Pelatih, Pembina"
                    />
                  </div>
                  <div>
                    <Label>Sebutan Tingkatan</Label>
                    <Input
                      value={formData.levelSingularTitle}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          levelSingularTitle: e.target.value,
                        }))
                      }
                      type="text"
                      placeholder="Contoh: Jilid, Kelas, Sabuk"
                    />
                  </div>
                  <div>
                    <Label>Label Pembayaran</Label>
                    <Input
                      value={formData.paymentLabel}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          paymentLabel: e.target.value,
                        }))
                      }
                      type="text"
                      placeholder="Contoh: SPP, Iuran"
                    />
                  </div>
                </div>
              </section>
            </CardContent>

            <CardFooter className="flex flex-col-reverse gap-2 border-t bg-muted/30 p-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                disabled={isSaving}
                onClick={handleResetSettings}
              >
                Kembalikan Default
              </Button>
              <Button
                type="submit"
                className="w-full sm:w-auto"
                disabled={isSaving}
              >
                {isSaving ? "Menyimpan..." : "Simpan Pengaturan"}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  );
};

export default OrganizationTermsView;
