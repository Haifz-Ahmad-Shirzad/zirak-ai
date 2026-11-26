import { useEffect, useRef, useState } from "react";
import { FileText, Paperclip, Send, Square, X } from "lucide-react";
import { useAutoResizeTextarea } from "../hooks/useAutoResizeTextarea.js";
import { t } from "../i18n.js";

const DEFAULT_MAX_FILES = 4;
const DEFAULT_MAX_TOTAL_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

const readAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read this file."));
    reader.readAsDataURL(file);
  });

export default function ChatInput({
  onSend,
  onStop,
  disabled,
  locale = "en",
  attachmentsEnabled = true,
  allowPdf = true,
  maxAttachments = DEFAULT_MAX_FILES,
  maxTotalBytes = DEFAULT_MAX_TOTAL_BYTES,
  provider = "openai",
}) {
  const [input, setInput] = useState("");
  const [files, setFiles] = useState([]);
  const [fileError, setFileError] = useState("");
  const textareaRef = useAutoResizeTextarea(input);
  const fileInputRef = useRef(null);
  const filesRef = useRef(files);
  filesRef.current = files;

  useEffect(() => () => {
    filesRef.current.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
  }, []);

  const revokePreviews = (items) => items.forEach((item) => {
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
  });

  const clearFiles = () => {
    revokePreviews(filesRef.current);
    filesRef.current = [];
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileSelection = (fileList) => {
    setFileError("");
    if (!attachmentsEnabled) {
      setFileError(t(locale, "chooseVisionProvider"));
      return;
    }

    const nextFiles = [...filesRef.current];
    let totalBytes = nextFiles.reduce((sum, item) => sum + item.file.size, 0);
    const acceptedTypes = allowPdf ? ACCEPTED_TYPES : new Set(["image/jpeg", "image/png", "image/webp"]);

    for (const file of Array.from(fileList || [])) {
      if (!acceptedTypes.has(file.type)) {
        setFileError(t(locale, "unsupportedFile"));
        continue;
      }
      const fileLimit = file.type === "application/pdf" ? maxTotalBytes : 5 * 1024 * 1024;
      if (file.size > fileLimit) {
        setFileError(t(locale, "fileTooLarge"));
        continue;
      }
      if (nextFiles.length >= maxAttachments || totalBytes + file.size > maxTotalBytes) {
        setFileError(t(locale, provider === "groq" ? "groqAttachmentLimit" : "attachmentLimit"));
        break;
      }
      nextFiles.push({
        id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
        file,
        previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : "",
      });
      totalBytes += file.size;
    }

    filesRef.current = nextFiles;
    setFiles(nextFiles);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (id) => {
    const item = filesRef.current.find((entry) => entry.id === id);
    if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
    const nextFiles = filesRef.current.filter((entry) => entry.id !== id);
    filesRef.current = nextFiles;
    setFiles(nextFiles);
    setFileError("");
  };

  const handleSend = async () => {
    const text = input.trim();
    if ((!text && files.length === 0) || disabled) return;
    if (files.length > 0 && !attachmentsEnabled) {
      setFileError(t(locale, "chooseVisionProvider"));
      return;
    }
    if (!allowPdf && files.some((item) => item.file.type === "application/pdf")) {
      setFileError(t(locale, "groqPdfUnsupported"));
      return;
    }

    try {
      const attachments = await Promise.all(files.map(async ({ file }) => ({
        name: file.name,
        type: file.type,
        size: file.size,
        data: await readAsDataUrl(file),
      })));
      await onSend(text, attachments);
      setInput("");
      clearFiles();
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    } catch (error) {
      setFileError(error.message || t(locale, "fileReadFailed"));
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    handleFileSelection(event.dataTransfer.files);
  };

  return (
    <div className="border-t border-gray-700 bg-gray-900 px-4 py-4 sm:px-6"
      onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}>
      <div className="mx-auto max-w-3xl">
        {files.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2" aria-label={t(locale, "attachments")}>
            {files.map(({ id, file, previewUrl }) => (
              <div key={id} className="flex max-w-full items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-2 py-2 text-sm">
                {previewUrl ? <img src={previewUrl} alt="" className="h-10 w-10 rounded object-cover" /> : <FileText className="h-5 w-5 shrink-0" />}
                <span className="max-w-40 truncate">{file.name}</span>
                <button type="button" onClick={() => removeFile(id)}
                  className="inline-flex min-h-9 min-w-9 items-center justify-center rounded hover:bg-gray-700"
                  aria-label={`${t(locale, "removeAttachment")} ${file.name}`} title={t(locale, "removeAttachment")}>
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2 sm:gap-3">
          <input ref={fileInputRef} type="file" accept={allowPdf ? "image/jpeg,image/png,image/webp,application/pdf" : "image/jpeg,image/png,image/webp"}
            multiple className="sr-only" onChange={(event) => handleFileSelection(event.target.files)}
            aria-label={t(locale, "attachFiles")} />
          <button type="button" onClick={() => fileInputRef.current?.click()}
            disabled={disabled || !attachmentsEnabled}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-gray-700 hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={t(locale, "attachFiles")}
            title={attachmentsEnabled ? t(locale, "attachFiles") : t(locale, "chooseVisionProvider")}>
            <Paperclip className="h-5 w-5" />
          </button>

          <textarea ref={textareaRef} value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown} placeholder={t(locale, "typeMessage")}
            aria-label={t(locale, "typeMessage")} rows={1} disabled={disabled}
            className="flex-1 bg-gray-800 text-gray-100 rounded-lg px-4 py-3 resize-none outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500 disabled:opacity-50"
            style={{ maxHeight: "200px" }} />

          {disabled ? (
            <button type="button" onClick={onStop}
              className="min-h-11 min-w-11 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors shrink-0"
              aria-label={t(locale, "stopGenerating")} title={t(locale, "stopGenerating")}>
              <Square className="w-5 h-5" />
            </button>
          ) : (
            <button type="button" onClick={handleSend}
              disabled={!input.trim() && files.length === 0}
              className="min-h-11 min-w-11 p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 rounded-lg text-white transition-colors shrink-0"
              aria-label={t(locale, "sendMessage")} title={t(locale, "sendMessage")}>
              <Send className="w-5 h-5" />
            </button>
          )}
        </div>
        {fileError && <p role="alert" className="mt-2 text-sm text-red-400">{fileError}</p>}
        {!attachmentsEnabled && <p className="mt-2 text-xs text-gray-400">{t(locale, "chooseVisionProvider")}</p>}
        <p className="mt-2 text-xs text-gray-400">{provider === "groq" ? t(locale, "groqImageHelp") : t(locale, "attachmentHelp")}</p>
      </div>
    </div>
  );
}
