import { useState } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../service/firebase_setup";

export default function Migration() {
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setLog((prev) => [...prev, msg]);
    console.log(msg);
  };

  const runMigration = async () => {
    setLoading(true);
    addLog("Bắt đầu gọi script...");
    try {
      const snapshot = await getDocs(collection(db, "vocabularies"));
      addLog(`Tìm thấy ${snapshot.docs.length} vocabularies documents.`);
      
      let patchedDocs = 0;

      for (const document of snapshot.docs) {
        const data = document.data();
        const words = data.words || [];
        let isModified = false;
        const newWords = [];

        for (const item of words) {
          if (item.ipa) {
             newWords.push(item);
             continue;
          }

          try {
            const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(item.word)}`);
            if (res.ok) {
              const json = await res.json();
              const phonetics = json[0]?.phonetics;
              const phonetic = phonetics?.find((p: { text?: string }) => p.text)?.text || json[0]?.phonetic;
              if (phonetic) {
                isModified = true;
                newWords.push({ ...item, ipa: phonetic });
                // Delay nhỏ để tránh spam API dẫn đến dính rate limit
                await new Promise(resolve => setTimeout(resolve, 300));
                continue;
              }
            } else if (res.status === 429) {
               addLog(`Rate limit 429 tại từ ${item.word}, đợi 2s...`);
               await new Promise(resolve => setTimeout(resolve, 2000));
            }
          } catch (e) {
            console.error(e);
          }
          
          newWords.push(item);
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        if (isModified) {
          await updateDoc(doc(db, "vocabularies", document.id), {
            words: newWords
          });
          patchedDocs++;
          addLog(`Đã cập nhật document: ${document.id}`);
        }
      }

      addLog(`Hoàn tất. Đã bổ sung IPA cho ${patchedDocs} danh sách từ vựng.`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      addLog(`Lỗi: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto mt-8 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Tool Bổ Sung IPA</h1>
      <p className="mb-4 text-gray-600">
        Công cụ này sẽ duyệt qua toàn bộ database các danh sách từ vựng (Vocabulary collections), kiểm tra những từ cũ chưa có IPA và tiến hành gọi dictionary API để thêm vào.
      </p>
      
      <button 
        onClick={runMigration} 
        disabled={loading}
        className={`px-4 py-2 rounded text-white font-semibold ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
      >
        {loading ? "Đang chạy script..." : "Bắt đầu cập nhật API cho từ cũ"}
      </button>
      
      <div className="mt-6 p-4 bg-gray-800 text-gray-200 rounded h-80 overflow-y-auto font-mono text-sm leading-relaxed">
        {log.length === 0 && <span className="text-gray-500">Chưa có log...</span>}
        {log.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  );
}
