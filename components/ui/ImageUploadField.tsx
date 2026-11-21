"use client";

import { Image as ImageIcon, Paperclip } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (value: string, file?: File) => void;
}

/**
 * Rediseño (feedback del cliente): antes la vista previa era un cuadrado
 * chico (96×96) al costado de los controles de subida — el cliente pidió
 * que la foto se vea más grande. Pasa a un banner a todo el ancho
 * (`aspectRatio: 16/9`), con los controles de subida (tabs + botón/URL)
 * debajo en vez de al lado — así la vista previa puede crecer sin competir
 * por espacio horizontal con el resto del formulario.
 *
 * Migrado a shadcn (D134): pestañas de `tabs` (44 px de alto, la línea del
 * sitio) y el campo de URL con `Input`.
 */
export function ImageUploadField({
  label,
  value,
  onChange,
}: ImageUploadFieldProps) {
  const [tab, setTab] = useState<"upload" | "url">("upload");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    onChange(URL.createObjectURL(file), file);
  }

  return (
    <div>
      <div className="mb-1.5 text-12 font-medium text-foreground">{label}</div>

      <div
        className="mb-2 flex aspect-video w-full items-center justify-center rounded-md border border-border bg-primary-dark bg-cover bg-center"
        style={value ? { backgroundImage: `url(${value})` } : undefined}
      >
        {!value && (
          <ImageIcon aria-hidden="true" className="size-10 text-white/40" />
        )}
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "upload" | "url")}>
        <TabsList aria-label="Origen de la imagen" className="mb-1.5">
          <TabsTrigger value="upload" className="text-12">
            Subir archivo
          </TabsTrigger>
          <TabsTrigger value="url" className="text-12">
            URL
          </TabsTrigger>
        </TabsList>

        {/*
          El botón y el campo de URL miden lo mismo (40 px): cambiar de
          pestaña no mueve el resto del formulario.
        */}
        <TabsContent value="upload">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleFileChange}
          />
          {/* Mismo estilo que "Comprobante" del paso de pago (PaymentStep). */}
          <Button
            variant="action"
            onClick={() => inputRef.current?.click()}
            className="h-10 min-h-10 text-12"
          >
            <Paperclip aria-hidden="true" className="size-5" />
            {value ? "Cambiar imagen" : "Elegir imagen"}
          </Button>
        </TabsContent>
        <TabsContent value="url">
          <Input
            placeholder="https://..."
            aria-label={`${label} — URL`}
            type="url"
            className="text-14"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
