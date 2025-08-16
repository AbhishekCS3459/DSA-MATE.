"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Mic, MicOff, Play, Pause, Square, Trash2, Upload } from "lucide-react"

interface VoiceRecorderProps {
  onVoiceNoteUploaded: (url: string) => void
  noteId?: string
}

export function VoiceRecorder({ onVoiceNoteUploaded, noteId }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioUrl])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      })

      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" })
        setAudioBlob(blob)
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start(1000) // Collect data every second
      setIsRecording(true)
      setRecordingTime(0)

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (error) {
      console.error("Error starting recording:", error)
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume()
        timerRef.current = setInterval(() => {
          setRecordingTime((prev) => prev + 1)
        }, 1000)
      } else {
        mediaRecorderRef.current.pause()
        if (timerRef.current) {
          clearInterval(timerRef.current)
        }
      }
      setIsPaused(!isPaused)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsPaused(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

  const playAudio = () => {
    if (audioRef.current && audioUrl) {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        audioRef.current.play()
        setIsPlaying(true)
      }
    }
  }

  const deleteRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
    setAudioBlob(null)
    setAudioUrl(null)
    setRecordingTime(0)
    setIsPlaying(false)
  }

  const uploadVoiceNote = async () => {
    if (!audioBlob || !noteId) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("audio", audioBlob, `voice-note-${Date.now()}.webm`)
      formData.append("noteId", noteId)

      const response = await fetch("/api/voice-notes", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      if (response.ok) {
        onVoiceNoteUploaded(data.url)
        deleteRecording() // Clear the recording after upload
      }
    } catch (error) {
      console.error("Error uploading voice note:", error)
    } finally {
      setIsUploading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Recording Controls */}
          <div className="flex items-center justify-center gap-2">
            {!isRecording && !audioBlob && (
              <Button onClick={startRecording} className="flex items-center gap-2">
                <Mic className="h-4 w-4" />
                Start Recording
              </Button>
            )}

            {isRecording && (
              <>
                <Button onClick={pauseRecording} variant="outline" className="flex items-center gap-2 bg-transparent">
                  {isPaused ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                  {isPaused ? "Resume" : "Pause"}
                </Button>
                <Button onClick={stopRecording} variant="destructive" className="flex items-center gap-2">
                  <Square className="h-4 w-4" />
                  Stop
                </Button>
              </>
            )}
          </div>

          {/* Recording Timer */}
          {isRecording && (
            <div className="text-center">
              <div className="text-2xl font-mono font-bold text-red-600">{formatTime(recordingTime)}</div>
              <div className="text-sm text-muted-foreground">{isPaused ? "Recording paused" : "Recording..."}</div>
              {!isPaused && <Progress value={undefined} className="w-full mt-2" />}
            </div>
          )}

          {/* Playback Controls */}
          {audioBlob && audioUrl && (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2">
                <Button onClick={playAudio} variant="outline" className="flex items-center gap-2 bg-transparent">
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {isPlaying ? "Pause" : "Play"}
                </Button>
                <Button onClick={deleteRecording} variant="outline" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                Recording length: {formatTime(recordingTime)}
              </div>

              {noteId && (
                <div className="flex justify-center">
                  <Button onClick={uploadVoiceNote} disabled={isUploading} className="flex items-center gap-2">
                    {isUploading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Save Voice Note
                      </>
                    )}
                  </Button>
                </div>
              )}

              <audio
                ref={audioRef}
                src={audioUrl}
                onEnded={() => setIsPlaying(false)}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                style={{ display: "none" }}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
