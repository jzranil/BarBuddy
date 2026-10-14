
import { useState } from "react";
import Papa from "papaparse";
import { supabase } from "../../lib/supabaseClient";

const REQUIRED_COLUMNS = [
  "subject",
  "question_text",
  "question_model_answer",
];

export default function QuestionCSVUploadModal({
  onClose,
  onSuccess,
}) {
  const [questions, setQuestions] = useState([]);
  const [errors, setErrors] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState("");

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setQuestions([]);
    setErrors([]);
    setFileName(file.name);

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setErrors(["Please select a valid CSV file."]);
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (header) =>
        header.replace(/^\uFEFF/, "").trim(),
      complete: (result) => {
        const validationErrors = [];
        const validQuestions = [];
        const seen = new Set();

        const headers = result.meta.fields || [];

        const missing = REQUIRED_COLUMNS.filter(
          (column) => !headers.includes(column)
        );

        if (missing.length > 0) {
          setErrors([
            `Missing columns: ${missing.join(", ")}`,
          ]);
          return;
        }

        result.errors.forEach((error) => {
          validationErrors.push(
            `CSV parsing error at row ${
              (error.row ?? 0) + 2
            }: ${error.message}`
          );
        });

        result.data.forEach((row, index) => {
          const subject = String(
            row.subject || ""
          ).trim();

          const questionText = String(
            row.question_text || ""
          ).trim();

          const modelAnswer = String(
            row.question_model_answer || ""
          ).trim();

          if (!subject || !questionText || !modelAnswer) {
            validationErrors.push(
              `Row ${index + 2}: Missing required data.`
            );
            return;
          }

          const duplicateKey = JSON.stringify([
            subject.toLowerCase(),
            questionText.toLowerCase(),
          ]);

          if (seen.has(duplicateKey)) {
            validationErrors.push(
              `Row ${index + 2}: Duplicate in CSV.`
            );
            return;
          }

          seen.add(duplicateKey);

          validQuestions.push({
            subject,
            question_text: questionText,
            question_model_answer: modelAnswer,
          });
        });

        setQuestions(validQuestions);
        setErrors(validationErrors);
      },
      error: (error) => {
        setErrors([error.message]);
      },
    });
  };

  
const handleUpload = async () => {
  if (questions.length === 0 || errors.length > 0) {
    return;
  }

  setUploading(true);
  setErrors([]);

  try {
    // STEP 1: Get the current Supabase Auth session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
      throw new Error(
        "Your session has expired. Please log in again."
      );
    }

    // STEP 2: Verify backend URL
    const apiUrl = import.meta.env.VITE_API_URL;

    if (!apiUrl) {
      throw new Error(
        "VITE_API_URL is missing in frontend/.env"
      );
    }

    // STEP 3: Send CSV questions to Hono backend
    const response = await fetch(
      `${apiUrl}/api/questions/import`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ questions }),
      }
    );

    // STEP 4: Read response as text first
    const responseText = await response.text();

    console.log("Import response status:", response.status);
    console.log("Import response:", responseText.slice(0, 500));

    let result;

    try {
      result = JSON.parse(responseText);
    } catch {
      throw new Error(
        `Backend returned invalid JSON (HTTP ${response.status}). ` +
        `Check the browser console and Hono backend terminal.`
      );
    }

    // STEP 5: Handle backend errors
    if (!response.ok) {
      throw new Error(
        result.message ||
        result.error ||
        `Import failed (HTTP ${response.status}).`
      );
    }

    if (result.success !== true) {
      throw new Error(
        result.message || "Import was not confirmed."
      );
    }

    // STEP 6: Display successful import counts
    alert(
      `Question import completed!\n\n` +
      `Imported: ${result.inserted}\n` +
      `Skipped: ${result.skipped}\n` +
      `Total: ${result.total}`
    );

    onSuccess?.(result);
    onClose?.();

  } catch (error) {
    console.error("Question import error:", error);

    setErrors([
      error.message || "Unable to import questions."
    ]);
  } finally {
    setUploading(false);
  }
};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-xl font-bold">
          Import Essay Questions
        </h2>

        <p className="mt-2 text-sm text-gray-600">
          Upload a CSV containing subjects, questions,
          and lawyer-approved model answers.
        </p>

        <input
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
          className="mt-5 block w-full rounded border p-3"
        />

        {fileName && (
          <p className="mt-3 text-sm">
            Selected: {fileName}
          </p>
        )}

        <p className="mt-2 text-sm">
          Valid questions: {questions.length}
        </p>

        {errors.length > 0 && (
          <div className="mt-4 max-h-40 overflow-y-auto rounded bg-red-50 p-3 text-sm text-red-700">
            {errors.map((error, index) => (
              <p key={index}>{error}</p>
            ))}
          </div>
        )}

        {questions.length > 0 && (
          <div className="mt-4 max-h-64 overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th className="p-2">Subject</th>
                  <th className="p-2">Question</th>
                  <th className="p-2">Answer</th>
                </tr>
              </thead>

              <tbody>
                {questions.slice(0, 10).map((q, index) => (
                  <tr key={index} className="border-t">
                    <td className="p-2">{q.subject}</td>
                    <td className="p-2">
                      {q.question_text.slice(0, 100)}...
                    </td>
                    <td className="p-2">
                      {q.question_model_answer.slice(0, 100)}...
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {questions.length > 10 && (
              <p className="p-2 text-xs text-gray-500">
                Showing first 10 questions only.
              </p>
            )}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={uploading}
            className="rounded border px-4 py-2"
          >
            Cancel
          </button>

          <button
            onClick={handleUpload}
            disabled={
              uploading ||
              !questions.length ||
              errors.length > 0
            }
            className="rounded bg-pink-600 px-4 py-2 text-white disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Import Questions"}
          </button>
        </div>
      </div>
    </div>
  );
}
