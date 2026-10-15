import { Icon, buttonClass } from "../ui-base";

// Navigation native : Safari reçoit directement le PDF, sans URL blob éphémère.
export function DownloadButton({ slug, fileName }: { slug: string; fileName: string }) {
  return <a href={`/api/attestation/${slug}/download`} target="_blank" rel="noreferrer" download={fileName} className={buttonClass("primary")}>
    <Icon name="download" className="h-5 w-5" />
    Télécharger mon attestation
  </a>;
}