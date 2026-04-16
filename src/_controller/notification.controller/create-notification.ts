import { Request, Response } from "express";
import { ReturnType } from "../../types";
import {
  checkZodSchema,
  response,
  responseError,
  throwError,
} from "../../utils/response";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import z from "zod";
import { env } from "../../env";
import { prisma } from "../../lib/dbs";
import { Prisma, Tipe_Tanaman } from "@prisma/client";
import { getUserSession } from "../../utils/user";
import { th } from "zod/v4/locales";
import { spawn } from "child_process";
import path from "path";

const MainSchema = z.object({
  plant: z.nativeEnum(Tipe_Tanaman),
});

export const createNotification = async (
  req: Request,
  res: Response,
): ReturnType => {
  try {
    const body = req.body as z.infer<typeof MainSchema>;

    checkZodSchema(MainSchema, body);

    if (!env.JWT_SECRET_KEY)
      throw throwError(404, "JWT_SECRET_KEY tidak ditemukan!");

    const { plant } = body;

    let data: any = null

    if (plant === "ALPUKAT") {
      data = await saveAlpukatData(req);
    }

    if (!data) throw throwError(400, "Gagal menyimpan data sensor");

    return response(res, 200, "Berhasil membuat notifikasi", data);
  } catch (error) {
    return responseError(res, error);
  }
};

const saveAlpukatData = async (req: Request) => {

  const userSession = getUserSession(req);

  if (!userSession) throw throwError(401, "Tidak terautentikasi");

  const sensorData = await prisma.sensor_Data.findMany({
    where: {
      Kebun: {
        Pivot_Kebun_User: {
          some: {
            user_id: userSession.id
          }
        }
      }
    },
    orderBy: {
      waktu_pengambilan: "asc"
    }
  })

  const length = sensorData.length

  if (length === 0) {
    throw throwError(404, "Data sensor tidak ditemukan");
  }

  const hoursLength = Math.floor(length / 6)

  if (hoursLength === 0) {
    throw throwError(404, "Data sensor tidak cukup untuk membuat notifikasi");
  }

  // return sensorData.map(data => ({
  //   date: new Date(data.waktu_pengambilan),
  //   tanggal: new Date(data.waktu_pengambilan).getUTCDate(),
  //   jam: `${new Date(data.waktu_pengambilan).getUTCHours()}:${new Date(data.waktu_pengambilan).getUTCMinutes()}`,
  // }))

  const groupedData = Array.from({ length: hoursLength }, (_, i) =>
    sensorData.slice(i * 6, (i + 1) * 6)
  );


  const averageData = groupedData.map(group => {
    return {
      suhu_udara: group.reduce((sum, data) => sum + (data.suhu_udara || 0), 0) / group.length,
      kelembaban_udara: group.reduce((sum, data) => sum + (data.kelembaban_udara || 0), 0) / group.length,
      suhu_tanah: group.reduce((sum, data) => sum + (data.suhu_tanah || 0), 0) / group.length,
      kelembaban_tanah: group.reduce((sum, data) => sum + (data.kelembaban_tanah || 0), 0) / group.length,
      intensitas_cahaya: group.reduce((sum, data) => sum + (data.intensitas_cahaya || 0), 0) / group.length,
      startDate: group[0].waktu_pengambilan,
      endDate: group[group.length - 1].waktu_pengambilan,
    }
  })

  const antraknosa = await scanAntraknosa(sensorData[0].kebun_id, averageData)

  return { antraknosa }

};

const scanAntraknosa = async (kebun_id: string, averageData: {
  suhu_udara: number;
  kelembaban_udara: number;
  suhu_tanah: number;
  kelembaban_tanah: number;
  intensitas_cahaya: number;
  startDate: Date;
  endDate: Date;
}[]) => {
  const antraknosa: {
    risk_prediction: number;
    startDate: Date;
    endDate: Date;
  }[] = []

  for (let i = 0; i * 2 < averageData.length; i++) {
    const rawData = averageData.slice(i * 2, (i * 2) + 8)

    const startDate = rawData[0].startDate
    const endDate = rawData[rawData.length - 1].endDate

    const inputDataPredict = rawData.map(data => [data.suhu_udara, data.kelembaban_udara]) as Array<[number, number]>
    if (inputDataPredict.length === 8) {
      // console.log({ inputDataPredict })
      const prediction = await runSubProcess("antraknosa.keras", inputDataPredict);
      antraknosa.push({ risk_prediction: prediction.risk_percentage, startDate, endDate });
      console.log(`Selesai ${i + 1} dari ${averageData.length - 7}`)
    }
  }

  let highestRisk = { risk_prediction: 0, startDate: new Date(), endDate: new Date() };
  for (const antraknosaData of antraknosa) {
    if (antraknosaData.risk_prediction > highestRisk.risk_prediction) {
      highestRisk = antraknosaData;
    }
  }

  await prisma.notifikasi.create({
    data: {
      judul: "Antraknosa",
      deskripsi: "Penyakit ini disebabkan karena cuaca yang lembab dan hangat, yang menciptakan kondisi ideal untuk pertumbuhan jamur. Antraknosa dapat menyebabkan bercak pada daun, batang, dan buah, yang akhirnya dapat menyebabkan kerusakan serius pada tanaman alpukat jika tidak ditangani dengan benar.",
      resiko_penyakit: `
              Antraknosa - Jamur Colletotrichum sp.
              ||
              Antraknosa adalah penyakit tanaman umum yang disebabkan oleh jamur, terutama Colletotrichum sp., ditandai dengan bercak cokelat hingga hitam pada daun, batang, atau buah yang sering membusuk. Penyakit ini sering disebut patek pada cabai, berkembang cepat di cuaca lembap/musim hujan, dan dapat merusak hasil panen secara signifikan.
              `,
      kemungkinan_penyebab: `
              Kelembapan udara tinggi (>70%) selama 8 hari berturut-turut akibat curah hujan berlebih dan kabut pagi hari
              ||
              Lorem ipsum dolor sit amet, consectetur adipisicing elit. Sit, necessitatibus iste facere dolores modi praesentium pariatur! Deleniti, officia dolorum perferendis ipsam sint, assumenda quisquam iusto quas labore at voluptates error eos? Ullam explicabo, quidem, voluptatem suscipit tempora deserunt, porro eligendi sunt perferendis soluta veritatis veniam ratione dolore vel quae. Quo voluptatibus nostrum molestias assumenda ratione, saepe eius perferendis quidem dolore obcaecati molestiae non dicta doloremque odit facere, maxime nam? Delectus, sed minima impedit aperiam voluptatem sequi facere dignissimos incidunt vero qui, pariatur alias? Molestias, ut repellendus corrupti voluptatem aperiam alias atque ipsam at reprehenderit porro cupiditate nam minus, consectetur ipsum?

              |||
              
              Suhu udara yang hangat (20-25°C) di malam hari yang tidak memungkinkan penguapan embun
              ||
              Lorem ipsum dolor sit amet, consectetur adipisicing elit. Sit, necessitatibus iste facere dolores modi praesentium pariatur! Deleniti, officia dolorum perferendis ipsam sint, assumenda quisquam iusto quas labore at voluptates error eos? Ullam explicabo, quidem, voluptatem suscipit tempora deserunt, porro eligendi sunt perferendis soluta veritatis veniam ratione dolore vel quae. Quo voluptatibus nostrum molestias assumenda ratione, saepe eius perferendis quidem dolore obcaecati molestiae non dicta doloremque odit facere, maxime nam? Delectus, sed minima impedit aperiam voluptatem sequi facere dignissimos incidunt vero qui, pariatur alias? Molestias, ut repellendus corrupti voluptatem aperiam alias atque ipsam at reprehenderit porro cupiditate nam minus, consectetur ipsum?
              
              `,
      rekomendasi_pencegahan: `
              Pemangkasan 
              ||
              Lakukan pemangkasan pada bagian tanaman yang terinfeksi untuk meningkatkan sirkulasi udara dan mengurangi kelembaban di sekitar tanaman. 
              
              |||
              
              Penggunaan Fungisida 
              || 
              Gunakan fungisida yang efektif untuk mengendalikan penyebaran penyakit ini. 3. 
              
              |||

              Sanitasi 
              || 
              Bersihkan area sekitar tanaman dari daun atau buah yang jatuh, karena dapat menjadi sumber infeksi. 
              
              |||
              
              Pemilihan Varietas 
              || 
              Pilih varietas alpukat yang tahan terhadap antraknosa jika memungkinkan.`,
      persentase_resiko: highestRisk.risk_prediction,
      kebun_id: kebun_id,
      analisis_mulai: highestRisk.startDate,
      analisis_berakhir: highestRisk.endDate,
    }
  })

  // await prisma.$transaction(async (prisma) => {
  //   for (const antraknosaData of antraknosa) {
  //     if (antraknosaData.risk_prediction > 80) {
  //       const check = await prisma.notifikasi.findFirst({
  //         where: {
  //           kebun_id: kebun_id,
  //           analisis_mulai: antraknosaData.startDate,
  //           analisis_berakhir: antraknosaData.endDate,
  //         }
  //       })
  //       if (!check) {
  //         await prisma.notifikasi.create({
  //           data: {
  //             judul: "Antraknosa",
  //             deskripsi: "Penyakit ini disebabkan karena cuaca yang lembab dan hangat, yang menciptakan kondisi ideal untuk pertumbuhan jamur. Antraknosa dapat menyebabkan bercak pada daun, batang, dan buah, yang akhirnya dapat menyebabkan kerusakan serius pada tanaman alpukat jika tidak ditangani dengan benar.",
  //             resiko_penyakit: `
  //             Antraknosa - Jamur Colletotrichum sp.
  //             ||
  //             Antraknosa adalah penyakit tanaman umum yang disebabkan oleh jamur, terutama Colletotrichum sp., ditandai dengan bercak cokelat hingga hitam pada daun, batang, atau buah yang sering membusuk. Penyakit ini sering disebut patek pada cabai, berkembang cepat di cuaca lembap/musim hujan, dan dapat merusak hasil panen secara signifikan.
  //             `,
  //             kemungkinan_penyebab: `
  //             Kelembapan udara tinggi (>70%) selama 8 hari berturut-turut akibat curah hujan berlebih dan kabut pagi hari
  //             ||
  //             Lorem ipsum dolor sit amet, consectetur adipisicing elit. Sit, necessitatibus iste facere dolores modi praesentium pariatur! Deleniti, officia dolorum perferendis ipsam sint, assumenda quisquam iusto quas labore at voluptates error eos? Ullam explicabo, quidem, voluptatem suscipit tempora deserunt, porro eligendi sunt perferendis soluta veritatis veniam ratione dolore vel quae. Quo voluptatibus nostrum molestias assumenda ratione, saepe eius perferendis quidem dolore obcaecati molestiae non dicta doloremque odit facere, maxime nam? Delectus, sed minima impedit aperiam voluptatem sequi facere dignissimos incidunt vero qui, pariatur alias? Molestias, ut repellendus corrupti voluptatem aperiam alias atque ipsam at reprehenderit porro cupiditate nam minus, consectetur ipsum?

  //             |||

  //             Suhu udara yang hangat (20-25°C) di malam hari yang tidak memungkinkan penguapan embun
  //             ||
  //             Lorem ipsum dolor sit amet, consectetur adipisicing elit. Sit, necessitatibus iste facere dolores modi praesentium pariatur! Deleniti, officia dolorum perferendis ipsam sint, assumenda quisquam iusto quas labore at voluptates error eos? Ullam explicabo, quidem, voluptatem suscipit tempora deserunt, porro eligendi sunt perferendis soluta veritatis veniam ratione dolore vel quae. Quo voluptatibus nostrum molestias assumenda ratione, saepe eius perferendis quidem dolore obcaecati molestiae non dicta doloremque odit facere, maxime nam? Delectus, sed minima impedit aperiam voluptatem sequi facere dignissimos incidunt vero qui, pariatur alias? Molestias, ut repellendus corrupti voluptatem aperiam alias atque ipsam at reprehenderit porro cupiditate nam minus, consectetur ipsum?

  //             `,
  //             rekomendasi_pencegahan: `
  //             Pemangkasan 
  //             ||
  //             Lakukan pemangkasan pada bagian tanaman yang terinfeksi untuk meningkatkan sirkulasi udara dan mengurangi kelembaban di sekitar tanaman. 

  //             |||

  //             Penggunaan Fungisida 
  //             || 
  //             Gunakan fungisida yang efektif untuk mengendalikan penyebaran penyakit ini. 3. 

  //             |||

  //             Sanitasi 
  //             || 
  //             Bersihkan area sekitar tanaman dari daun atau buah yang jatuh, karena dapat menjadi sumber infeksi. 

  //             |||

  //             Pemilihan Varietas 
  //             || 
  //             Pilih varietas alpukat yang tahan terhadap antraknosa jika memungkinkan.`,
  //             persentase_resiko: antraknosaData.risk_prediction,
  //             kebun_id: kebun_id,
  //             analisis_mulai: antraknosaData.startDate,
  //             analisis_berakhir: antraknosaData.endDate,
  //           }
  //         })
  //       }
  //     }
  //   }
  // }, {
  //   maxWait: 5000,
  //   timeout: 100000000000
  // })

  return antraknosa
}


const runSubProcess = async (model: "antraknosa.keras", inputDataPredict: Array<[number, number]>) => {
  try {
    const prediction: {
      success: boolean;
      risk_percentage: number,
      prediction: number
    } = await new Promise((resolve, reject) => {
      const pythonScript = path.join(__dirname, "model", "predict.py");
      const modelDir = path.dirname(pythonScript);
      const python = spawn("python", [`"${pythonScript}"`, JSON.stringify(inputDataPredict), model], {
        shell: true,
        cwd: modelDir,
        env: { ...process.env }
      });

      let output = "";
      let errorOutput = "";

      python.stdout.on("data", (data) => {
        output += data.toString();
      });

      python.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      python.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(`Python script error: ${errorOutput}`));
          return;
        }

        try {
          const result = JSON.parse(output.trim());
          if (result.success) {
            resolve(result);
          } else {
            reject(new Error(result.error));
          }
        } catch (e) {
          reject(new Error(`Failed to parse Python output: ${output}`));
        }
      });
    });

    if (!prediction.success) {
      throw throwError(500, "Gagal menjalankan model prediksi");

    }

    console.log({ prediction })

    return prediction;

  } catch (error) {
    console.error("Error running prediction:", error);
    throw throwError(500, "Gagal menjalankan model prediksi");
  }
}


