import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { Eraser, Check } from "lucide-react";

export function SignaturePad({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange: (dataUrl: string | undefined) => void;
}) {
  const ref = useRef<SignatureCanvas | null>(null);
  const [signed, setSigned] = useState(!!value);

  const clear = () => {
    ref.current?.clear();
    setSigned(false);
    onChange(undefined);
  };
  const save = () => {
    if (!ref.current || ref.current.isEmpty()) return;
    const url = ref.current.toDataURL("image/png");
    setSigned(true);
    onChange(url);
  };

  return (
    <div className="space-y-2">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">{label}</div>
      {value ? (
        <div className="rounded-lg border-2 border-[#1D6F42] bg-[#F1F8E9] p-2">
          <img src={value} alt={label} className="h-24 w-full object-contain" />
        </div>
      ) : (
        <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white">
          <SignatureCanvas
            ref={ref}
            penColor="#0d3b66"
            canvasProps={{ className: "w-full h-28 rounded-lg" }}
          />
        </div>
      )}
      <div className="flex gap-2">
        <Button type="button" size="sm" variant="outline" onClick={clear} className="h-7 gap-1 text-xs">
          <Eraser className="h-3 w-3" /> Effacer
        </Button>
        {!signed && (
          <Button
            type="button"
            size="sm"
            onClick={save}
            className="h-7 gap-1 bg-[#1D6F42] text-xs text-white hover:bg-[#1B5E20]"
          >
            <Check className="h-3 w-3" /> Valider signature
          </Button>
        )}
      </div>
    </div>
  );
}