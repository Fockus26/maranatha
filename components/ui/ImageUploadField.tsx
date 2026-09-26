"use client";

import AttachFileRoundedIcon from "@mui/icons-material/AttachFileRounded";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { useTheme } from "@mui/material/styles";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import { useRef, useState } from "react";
import { SMALL_FIELD_SX } from "@/theme/fieldStyles";
import { radius } from "@/theme/tokens";

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
 */
export function ImageUploadField({
  label,
  value,
  onChange,
}: ImageUploadFieldProps) {
  const theme = useTheme();
  const [tab, setTab] = useState<"upload" | "url">("upload");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    onChange(URL.createObjectURL(file), file);
  }

  return (
    <Box>
      <Box
        sx={{
          fontSize: "12px",
          fontWeight: 500,
          color: theme.palette.text.primary,
          mb: 1.5,
        }}
      >
        {label}
      </Box>

      <Box
        sx={{
          width: "100%",
          aspectRatio: "16 / 9",
          borderRadius: `${radius.md}px`,
          border: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.primary.dark,
          backgroundImage: value ? `url(${value})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          mb: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {!value && (
          <ImageOutlinedIcon
            sx={{ fontSize: 40, color: "rgba(255,255,255,0.4)" }}
          />
        )}
      </Box>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        aria-label="Origen de la imagen"
        sx={{ minHeight: 32, mb: 1.5 }}
      >
        <Tab
          value="upload"
          label="Subir archivo"
          sx={{ minHeight: 32, py: 0.5, fontSize: "12px" }}
        />
        <Tab
          value="url"
          label="URL"
          sx={{ minHeight: 32, py: 0.5, fontSize: "12px" }}
        />
      </Tabs>

      {/*
        El botón "Elegir imagen" (variant="outlined", tamaño "small" de MUI,
        ~30.75px) y el `TextField` de URL (~40px con `size="small"`) tenían
        alturas distintas — cambiar de tab movía el resto del formulario
        hacia arriba/abajo. Se fija `height: 40px` en ambos (vía sx en el
        Button, vía `.MuiInputBase-root` en el TextField) para que el
        contenedor no salte de alto al alternar.
      */}
      {tab === "upload" ? (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleFileChange}
          />
          {/* Mismo estilo que "Comprobante" del paso de pago (PaymentStep). */}
          <Button
            type="button"
            variant="outlined"
            color="inherit"
            startIcon={<AttachFileRoundedIcon fontSize="small" />}
            onClick={() => inputRef.current?.click()}
            sx={{ height: 40, textTransform: "none", fontSize: "12px" }}
          >
            {value ? "Cambiar imagen" : "Elegir imagen"}
          </Button>
        </>
      ) : (
        <TextField
          placeholder="https://..."
          aria-label={`${label} — URL`}
          type="url"
          fullWidth
          size="small"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          sx={{
            ...SMALL_FIELD_SX,
            "& .MuiInputBase-root": { fontSize: "14px", height: 40 },
          }}
        />
      )}
    </Box>
  );
}
