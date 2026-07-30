"use client";

import { Button } from "@/src/elements/ui/button";
import { cn } from "@/src/lib/utils";
import { ArrowLeft, RotateCcw, Send, Square, Trash2 } from "lucide-react";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import MicErrorModal from "./MicErrorModal";
import { AudioRecorderProps } from "@/src/types/components/chat";
import { AUDIORECORDER } from "@/src/data";

const MIN_BLOB_BYTES = 500;
const TIMESLICE_MS = 250;

const MIME_CANDIDATES = [
  "audio/ogg; codecs=opus",
  "audio/webm; codecs=opus",
  "audio/webm",
  "audio/mp4",
];

function getSupportedAudioMime(): string {
  if (typeof MediaRecorder === "undefined") return "audio/webm";
  for (const mime of MIME_CANDIDATES) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return "";
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onSend, onCancel }) => {
  const { t } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorType, setErrorType] = useState<"no-device" | "permission-denied" | "unknown">("unknown");
  const [hasDetailedErrorShown, setHasDetailedErrorShown] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeTypeRef = useRef<string>("audio/webm");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startTimer = useCallback(() => {
    setRecordingTime(0);
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const mimeType = getSupportedAudioMime();
      if (!mimeType) {
        setError(t("could_not_start_recording"));
        setErrorType("unknown");
        return;
      }
      mimeTypeRef.current = mimeType;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const recordedMime = mediaRecorder.mimeType || mimeTypeRef.current;
        const blobType = recordedMime || mimeTypeRef.current || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: blobType });
        stopStream();

        if (blob.size >= MIN_BLOB_BYTES) {
          setAudioBlob(blob);
          setError(null);
        } else {
          setAudioBlob(null);
          setError(t("recording_empty", "Recording too short or empty. Please try again."));
        }
      };

      mediaRecorder.start(TIMESLICE_MS);
      setIsRecording(true);
      setError(null);
      setAudioBlob(null);
      startTimer();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      stopStream();
      if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setError(t("mic_not_found"));
        setErrorType("no-device");
      } else if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setError(t("mic_permission_denied"));
        setErrorType("permission-denied");
      } else {
        setError(t("could_not_start_recording"));
        setErrorType("unknown");
      }

      if (!hasDetailedErrorShown) {
        setShowErrorModal(true);
        setHasDetailedErrorShown(true);
      }
      setIsRecording(false);
    }
  }, [hasDetailedErrorShown, startTimer, stopStream, t]);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && isRecording && recorder.state === "recording") {
      recorder.requestData();
      recorder.stop();
      setIsRecording(false);
      stopTimer();
    }
  }, [isRecording, stopTimer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const canSend = !isRecording && audioBlob && audioBlob.size >= MIN_BLOB_BYTES && !error;

  const handleSend = useCallback(() => {
    if (canSend && audioBlob) {
      onSend(audioBlob);
    }
  }, [audioBlob, canSend, onSend]);

  const handleDelete = useCallback(() => {
    setAudioBlob(null);
    setRecordingTime(0);
    setIsRecording(false);
    setError(null);
  }, []);

  const restartRecording = useCallback(async () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state === "recording") {
      recorder.requestData();
      recorder.stop();
    }
    stopTimer();
    stopStream();
    setAudioBlob(null);
    setError(null);
    setIsRecording(false);

    setTimeout(() => {
      startRecording();
    }, 100);
  }, [startRecording, stopStream, stopTimer]);

  useEffect(() => {
    if (!audioBlob) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(audioBlob);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [audioBlob]);

  useEffect(() => {
    startRecording();
    return () => {
      stopTimer();
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state === "recording") {
        recorder.requestData();
        recorder.stop();
      }
      stopStream();
    };
  }, [startRecording, stopStream, stopTimer]);

  return (
    <div className="flex items-center gap-2 p-2 px-4 h-18 w-full animate-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-1 group/back">
        <Button variant="ghost" size="icon" onClick={onCancel} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-(--table-hover) dark:text-gray-400 rounded-full transition-all">
          <ArrowLeft size={20} />
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-between bg-slate-50 dark:bg-(--page-body-bg) border border-slate-200 dark:border-(--card-border-color) rounded-lg px-4 py-2 min-h-12 mx-2 shadow-sm relative overflow-hidden">
        {error ? (
          <div className="flex items-center gap-3 w-full">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="text-sm text-rose-500 font-medium">{error}</span>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 z-10">
              <div className={cn("w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]", isRecording && "animate-pulse")} />
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200 tabular-nums min-w-9">{formatTime(recordingTime)}</span>
            </div>

            <div className="flex-1 flex justify-center z-10 min-w-0">
              {isRecording ? (
                <div className="flex items-center gap-1 px-4">
                  {AUDIORECORDER.map((h, i) => (
                    <div
                      key={i}
                      className="w-0.5 bg-primary rounded-full animate-voice-wave"
                      style={{
                        height: `${h * 4}px`,
                        animationDelay: `${i * 0.1}s`,
                      }}
                    />
                  ))}
                </div>
              ) : audioBlob && previewUrl ? (
                <audio src={previewUrl} controls className="h-8 max-w-[180px] w-full" />
              ) : (
                <span className="text-sm text-slate-400 font-medium italic animate-in fade-in duration-500">{t("recording_paused")}</span>
              )}
            </div>

            <div className="flex items-center gap-1 z-10">
              {isRecording ? (
                <button onClick={stopRecording} className="p-2 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all active:scale-95" title="Stop recording">
                  <Square size={18} fill="currentColor" />
                </button>
              ) : (
                audioBlob && (
                  <button onClick={handleDelete} className="p-2 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all active:scale-95" title="Delete recording">
                    <Trash2 size={18} />
                  </button>
                )
              )}

              {(isRecording || audioBlob) && (
                <button onClick={restartRecording} className="p-2 rounded-full text-slate-400 hover:text-primary hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all active:scale-95" title="Restart recording">
                  <RotateCcw size={18} />
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <div className="z-10 bg-white dark:bg-transparent rounded-full p-1">
        <Button onClick={handleSend} disabled={!canSend} className={cn("h-12 w-12 rounded-lg  flex items-center justify-center transition-all duration-300 shadow-lg", canSend ? "bg-primary text-white scale-110 shadow-emerald-500/30 hover:shadow-emerald-500/50" : "bg-slate-100 text-slate-300 dark:bg-slate-800 dark:text-slate-600 shadow-none")}>
          <Send size={22} className={cn("transition-transform duration-300", canSend && "scale-110")} />
        </Button>
      </div>

      <MicErrorModal isOpen={showErrorModal} onClose={() => setShowErrorModal(false)} errorType={errorType} />
    </div>
  );
};

export default AudioRecorder;
