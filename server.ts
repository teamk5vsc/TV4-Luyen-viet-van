import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());
const PORT = 3000;

// Lazy initialization of Gemini SDK
let aiInstance: GoogleGenAI | null = null;

function getGeminiClient(apiKeyOverride?: string): GoogleGenAI | null {
  const apiKey = apiKeyOverride || process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    console.warn('GEMINI_API_KEY is not defined or is a placeholder. Using intelligent simulated grading engine.');
    return null;
  }
  // Create new instance per request when using override (different keys possible)
  if (apiKeyOverride) {
    return new GoogleGenAI({
      apiKey: apiKeyOverride,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });
  }
  return aiInstance;
}

// Model fallback chain as per AI_INSTRUCTIONS.md
const MODEL_FALLBACK_CHAIN = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'];

async function generateWithFallback(
  client: GoogleGenAI,
  requestedModel: string | undefined,
  contents: string,
  config: { responseMimeType?: string; temperature?: number }
): Promise<string> {
  const models = requestedModel 
    ? [requestedModel, ...MODEL_FALLBACK_CHAIN.filter(m => m !== requestedModel)]
    : MODEL_FALLBACK_CHAIN;
  
  let lastError: any = null;
  for (const model of models) {
    try {
      console.log(`Trying model: ${model}`);
      const response = await client.models.generateContent({
        model,
        contents,
        config,
      });
      return response.text || '';
    } catch (err: any) {
      console.warn(`Model ${model} failed:`, err.message || err);
      lastError = err;
      // If rate limited (429), try next model
      if (err.status === 429 || err.message?.includes('RESOURCE_EXHAUSTED')) {
        continue;
      }
      // For other errors, also try next model
      continue;
    }
  }
  throw lastError || new Error('All models failed');
}

function cleanJsonResponse(text: string): string {
  let cleaned = text.trim();
  // Remove markdown code block markers
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  return cleaned.trim();
}

// Simulated data helpers for offline fallback so the application is instantly functional
function getMockOutline(topic: string, type: string) {
  const cleanTopic = topic || 'Tả cảnh giờ ra chơi';
  
  const genreData: Record<string, {
    genre: string;
    requirements: string[];
    outline: { mobi: string[]; thanbi: string[]; ketbi: string[] };
    keywords: string[];
    errorsToAvoid: string[];
  }> = {
    'ta-cay-coi': {
      genre: 'Văn tả cây cối',
      requirements: [
        `Xác định đúng đối tượng tả cây cối: ${cleanTopic}`,
        'Tả bao quát dáng vẻ bên ngoài của cây',
        'Tả chi tiết các bộ phận nổi bật (thân, lá, hoa, quả)',
        'Sử dụng từ ngữ gợi tả sinh động và nghệ thuật so sánh, nhân hóa',
        'Nêu ích lợi và tình cảm chăm sóc cây xanh'
      ],
      outline: {
        mobi: [
          `Giới thiệu cây định tả: ${cleanTopic} (Trồng ở đâu? Ai trồng?)`,
          'Nêu ấn tượng bao quát đầu tiên.'
        ],
        thanbi: [
          'Tả bao quát hình dáng, tán lá từ xa.',
          'Tả chi tiết các bộ phận theo trình tự (gốc, rễ, thân, cành, lá, hoa hoặc quả).',
          'Ích lợi của cây đối với con người và môi trường xung quanh.'
        ],
        ketbi: [
          'Bày tỏ tình cảm gắn bó yêu mến dành cho cây.',
          'Ý thức chăm sóc, bảo vệ cây xanh của bản thân.'
        ]
      },
      keywords: ['xum xuê', 'tán lá', 'gốc rễ', 'rì rào', 'xanh mướt', 'ngọt lành', 'chăm sóc'],
      errorsToAvoid: [
        'Tránh kể lể khô khan các bộ phận như bài sinh học.',
        'Tránh tả lộn xộn, thiếu trình tự quan sát rõ ràng.'
      ]
    },
    'ke-chuyen-da-doc-da-nghe': {
      genre: 'Kể chuyện đã đọc, đã nghe',
      requirements: [
        `Giới thiệu đúng tên câu chuyện cổ tích/ngụ ngôn: ${cleanTopic}`,
        'Kể các sự việc chính theo trình tự thời gian hợp lý',
        'Dùng lời văn của mình diễn đạt sinh động',
        'Nêu được bài học ý nghĩa rút ra'
      ],
      outline: {
        mobi: [
          `Giới thiệu câu chuyện đã đọc, đã nghe: ${cleanTopic}`,
          'Nêu nhân vật chính hoặc hoàn cảnh đọc/nghe kể.'
        ],
        thanbi: [
          'Sự việc mở đầu dẫn dắt câu chuyện.',
          'Diễn biến các sự việc chính kế tiếp theo trình tự thời gian rõ ràng.',
          'Sự việc kết thúc câu chuyện.'
        ],
        ketbi: [
          'Nêu kết cục và giá trị câu chuyện.',
          'Nêu bài học đạo đức bổ ích bản thân rút ra.'
        ]
      },
      keywords: ['ngày xưa', 'bỗng nhiên', 'thế rồi', 'nhân hậu', 'vượt khó', 'bài học', 'giúp đỡ'],
      errorsToAvoid: [
        'Tránh chép y nguyên cốt truyện cũ thiếu sự sáng tạo trong diễn đạt.',
        'Tránh kể quá vắn tắt làm mất đi cái hay của truyện.'
      ]
    },
    'cam-xuc-nhan-vat-van-hoc': {
      genre: 'Cảm xúc về nhân vật văn học',
      requirements: [
        `Giới thiệu đúng nhân vật và tác phẩm: ${cleanTopic}`,
        'Bộc lộ tình cảm cảm xúc trực tiếp chân thành',
        'Chọn dẫn chứng hành động, phẩm chất tiêu biểu của nhân vật',
        'Nêu bài học rèn luyện bản thân'
      ],
      outline: {
        mobi: [
          `Giới thiệu nhân vật văn học và truyện/thơ tương ứng: ${cleanTopic}`,
          'Khái quát cảm xúc sâu sắc dành cho nhân vật.'
        ],
        thanbi: [
          'Cảm xúc về đặc điểm ngoại hình hoặc tính cách tốt đẹp của nhân vật.',
          'Chi tiết/hành động cụ thể trong tác phẩm làm em xúc động nhất.',
          'Ý nghĩa của nhân vật bồi đắp tình cảm cho em.'
        ],
        ketbi: [
          'Khẳng định tình cảm yêu quý lâu bền dành cho nhân vật.',
          'Lời hứa học tập noi gương phẩm chất tốt của nhân vật.'
        ]
      },
      keywords: ['hiếu thảo', 'dũng cảm', 'nhân hậu', 'kính phục', 'xúc động', 'tấm gương', 'ngưỡng mộ'],
      errorsToAvoid: [
        'Tránh lạc sang tóm tắt lại toàn bộ câu chuyện.',
        'Tránh khen ngợi hời hợt, thiếu dẫn chứng cụ thể trong tác phẩm.'
      ]
    },
    'thuat-lai-su-viec': {
      genre: 'Thuật lại một sự việc',
      requirements: [
        `Thuật lại sự việc em tham gia hoặc chứng kiến: ${cleanTopic}`,
        'Tiến trình diễn biến trước - trong - sau rõ ràng',
        'Tả kết hợp hoạt động của con người sinh động',
        'Nêu kết quả và ý nghĩa của hoạt động'
      ],
      outline: {
        mobi: [
          `Giới thiệu sự việc ý nghĩa: ${cleanTopic} (Thời gian, địa điểm diễn ra?)`,
          'Cảm xúc háo hức ban đầu trước khi bắt đầu.'
        ],
        thanbi: [
          'Không khí chuẩn bị dụng cụ, phương tiện chu đáo.',
          'Thuật lại tiến trình diễn biến các sự việc chính theo trình tự thời gian.',
          'Các hoạt động nổi bật, nụ cười tinh thần của mọi người.'
        ],
        ketbi: [
          'Kết quả tốt đẹp của sự việc mang lại.',
          'Bày tỏ niềm tự hào và bài học gắn kết tinh thần đoàn kết tập thể.'
        ]
      },
      keywords: ['rộn ràng', 'phân công', 'nhanh nhẹn', 'kết quả', 'đoàn kết', 'lao động', 'kỷ niệm'],
      errorsToAvoid: [
        'Tránh viết lan man, thiếu tập trung vào hoạt động chính.',
        'Tránh viết như biên bản lịch trình khô khan không chút cảm xúc.'
      ]
    },
    'neu-y-kien-hien-tuong': {
      genre: 'Nêu ý kiến về một hiện tượng',
      requirements: [
        `Bày tỏ lập trường rõ ràng về hiện tượng: ${cleanTopic}`,
        'Có ít nhất hai lý lẽ logic để bảo vệ quan điểm',
        'Có dẫn chứng thực tế minh họa thuyết phục',
        'Lời văn gãy gọn, mang tính kêu gọi'
      ],
      outline: {
        mobi: [
          `Giới thiệu hiện tượng đời sống cần bàn luận: ${cleanTopic}`,
          'Khẳng định lập trường đồng tình hay phản đối rõ rệt.'
        ],
        thanbi: [
          'Lý lẽ 1: Giải thích nguyên nhân hoặc tầm quan trọng của vấn đề.',
          'Lý lẽ 2: Phân tích lợi ích hoặc tác hại đi kèm dẫn chứng thực tế sinh động.',
          'Nhận định ý thức hành vi đúng đắn cần thực hiện.'
        ],
        ketbi: [
          'Khẳng định lại lập trường quan điểm cá nhân một lần nữa.',
          'Đề xuất thông điệp khuyên nhủ, kêu gọi bạn bè cùng hưởng ứng.'
        ]
      },
      keywords: ['đồng tình', 'phản đối', 'lý lẽ', 'dẫn chứng', 'tự lập', 'trách nhiệm', 'lối sống'],
      errorsToAvoid: [
        'Tránh quan điểm mập mờ, lúc đồng ý lúc lại bác bỏ.',
        'Tránh lý luận suông thiếu ví dụ thực tế học đường gần gũi.'
      ]
    },
    'neu-y-kien-cau-chuyen': {
      genre: 'Nêu lý lý do yêu thích câu chuyện',
      requirements: [
        `Chỉ rõ tên câu chuyện em yêu mến: ${cleanTopic}`,
        'Nêu các lý do về nội dung bài học hoặc nghệ thuật kể truyện',
        'Có dẫn chứng chi tiết đắt giá trong tác phẩm',
        'Khuyên bạn bè nên tìm đọc'
      ],
      outline: {
        mobi: [
          `Giới thiệu câu chuyện em yêu thích: ${cleanTopic}`,
          'Khái quát lý do lớn nhất tạo nên sự cuốn hút của câu chuyện.'
        ],
        thanbi: [
          'Lý do thích nội dung câu chuyện (ý nghĩa bài học, tính cách nhân vật).',
          'Lý do thích nghệ thuật kể chuyện (chi tiết kỳ ảo hấp dẫn, lối dẫn dắt sinh động).',
          'Nêu một chi tiết tiêu biểu làm nổi bật ý chí/phẩm chất của nhân vật.'
        ],
        ketbi: [
          'Khẳng định lại giá trị lâu bền của câu chuyện trong lòng em.',
          'Khuyên các bạn học sinh nên tìm đọc tác phẩm này.'
        ]
      },
      keywords: ['hấp dẫn', 'nhân văn', 'bài học', 'kỳ ảo', 'lao động', 'tự lập', 'chia sẻ'],
      errorsToAvoid: [
        'Tránh nhầm sang tóm tắt cốt truyện từ đầu đến cuối.',
        'Tránh nhận xét chung chung không chỉ rõ cái hay ở điểm nào.'
      ]
    },
    'cam-xuc-nguoi-than': {
      genre: 'Cảm xúc về người thân',
      requirements: [
        `Bày tỏ tình cảm đối với người thân thiết: ${cleanTopic}`,
        'Chọn các cử chỉ yêu thương hoặc hành động chăm sóc cụ thể',
        'Sử dụng từ ngữ bộc lộ cảm xúc dạt dào chân thành',
        'Nêu lời tự hứa ngoan ngoãn của bản thân'
      ],
      outline: {
        mobi: [
          `Giới thiệu người thân và mối quan hệ yêu quý: ${cleanTopic}`,
          'Nêu cảm nhận bao quát về tình thương của người đó dành cho em.'
        ],
        thanbi: [
          'Tả cử chỉ đặc sắc gợi tình thương (nụ cười, đôi bàn tay lao động).',
          'Sự chăm sóc, bảo bọc cụ thể hằng ngày mẹ/cha dành cho em.',
          'Kỷ niệm khó quên ghi dấu tình cảm ấm áp giữa hai người.'
        ],
        ketbi: [
          'Khẳng định tình yêu kính, trân trọng sâu sắc dành cho người thân.',
          'Tự hứa ngoan ngoãn học tốt để cha mẹ/thầy cô vui lòng.'
        ]
      },
      keywords: ['ân cần', 'tảo tần', 'lam lũ', 'ấm áp', 'kính yêu', 'biết ơn', 'ngoan ngoãn'],
      errorsToAvoid: [
        'Tránh tả ngoại hình người thân từ đầu đến chân như bài văn tả người thông thường.',
        'Tránh kể chuyện lan man thiếu bộc lộ cảm xúc nội tâm.'
      ]
    },
    'viet-thu': {
      genre: 'Viết thư',
      requirements: [
        'Đảm bảo cấu trúc 3 phần rõ ràng của bức thư',
        'Ghi ngày tháng địa điểm viết thư ở đầu thư chính xác',
        'Xưng hô thân mật phù hợp với người nhận',
        'Thông báo tình hình học tập lớp 4 thiết thực'
      ],
      outline: {
        mobi: [
          'Ghi địa điểm và ngày tháng năm viết thư ở góc trên.',
          'Lời xưng hô chào hỏi đầu thư thân thiện gửi người nhận thư.'
        ],
        thanbi: [
          'Nêu mục đích viết thư chân thành.',
          'Hỏi thăm tình hình sức khỏe, học tập của người nhận.',
          'Thông báo tình hình sức khỏe, học tập lớp 4 và các hoạt động của bản thân.'
        ],
        ketbi: [
          'Lời chúc sức khỏe gửi người nhận và lời hứa hẹn gặp lại.',
          'Lời chào tạm biệt, chữ ký và họ tên người viết ở cuối thư.'
        ]
      },
      keywords: ['thân mến', 'hỏi thăm', 'học tập lớp 4', 'chia sẻ', 'mong thư', 'lời chúc', 'bạn thân'],
      errorsToAvoid: [
        'Tránh thiếu các phần bắt buộc như ngày tháng hoặc chữ ký.',
        'Tránh xưng hô không phù hợp với đối tượng nhận thư.'
      ]
    },
    'viet-don': {
      genre: 'Viết đơn',
      requirements: [
        'Có Quốc hiệu, Tiêu ngữ và Tên đơn viết in hoa',
        'Ghi rõ địa chỉ kính gửi chính xác',
        'Nêu đầy đủ thông tin cá nhân và lý do viết đơn chính đáng',
        'Có lời cam kết và chữ ký người làm đơn'
      ],
      outline: {
        mobi: [
          'Quốc hiệu, Tiêu ngữ và Tên đơn viết in hoa nổi bật ở giữa.',
          'Địa điểm và ngày tháng viết đơn.',
          'Kính gửi người có thẩm quyền tiếp nhận.'
        ],
        thanbi: [
          'Thông tin cá nhân: Họ tên, ngày sinh, học sinh lớp 4.',
          'Trình bày lý do viết đơn trung thực, ngắn gọn.',
          'Lời cam kết chấp hành nghiêm chỉnh quy định.'
        ],
        ketbi: [
          'Lời cảm ơn chân thành gửi đến người nhận đơn.',
          'Họ tên và chữ ký của người làm đơn ở cuối.'
        ]
      },
      keywords: ['CỘNG HÒA', 'Kính gửi', 'học sinh lớp 4', 'lý do', 'cam kết', 'cảm ơn', 'người làm đơn'],
      errorsToAvoid: [
        'Tránh viết lan man như bài văn miêu tả cảm xúc.',
        'Tránh trình bày cẩu thả sai quy cách văn bản hành chính.'
      ]
    },
    'ta-con-vat': {
      genre: 'Văn tả con vật',
      requirements: [
        `Xác định đúng con vật cần tả: ${cleanTopic}`,
        'Tả ngoại hình nổi bật (màu lông, đôi mắt, bốn chân...)',
        'Tả hoạt động tinh nghịch đặc trưng đáng yêu',
        'Thể hiện tình cảm gắn bó yêu thương ở kết bài'
      ],
      outline: {
        mobi: [
          `Giới thiệu con vật định tả: ${cleanTopic}`,
          'Nêu hoàn cảnh nuôi hoặc lý do em miêu tả con vật.'
        ],
        thanbi: [
          'Tả hình dáng nổi bật bên ngoài kết hợp tính từ gợi hình.',
          'Tả thói quen hoạt động săn mồi, đùa giỡn lanh lợi hằng ngày.',
          'Ích lợi của con vật đối với đời sống gia đình em.'
        ],
        ketbi: [
          'Bộc lộ tình thương mến sâu sắc dành cho con vật.',
          'Nêu ý thức chăm sóc bảo vệ xem con vật như bạn thân.'
        ]
      },
      keywords: ['mềm mại', 'tròn xoe', 'nhanh nhẹn', 'đùa giỡn', 'bắt chuột', 'âu yếm', 'người bạn'],
      errorsToAvoid: [
        'Tránh liệt kê chi tiết con vật rời rạc thiếu liên kết sinh động.',
        'Tránh tả con vật hung dữ phi thực tế học đường.'
      ]
    },
    'viet-huong-dan-bao-cao': {
      genre: 'Viết hướng dẫn / Báo cáo',
      requirements: [
        'Đảm bảo bố cục rõ ràng có tiêu đề nổi bật',
        'Các bước hướng dẫn sắp xếp theo trình tự thời gian logic',
        'Nêu rõ công tác chuẩn bị nguyên vật liệu/thành phần',
        'Từ ngữ ngắn gọn, dễ hiểu mang tính chỉ dẫn'
      ],
      outline: {
        mobi: [
          'Nêu tên bản hướng dẫn làm đồ chơi hoặc báo cáo thảo luận nhóm.',
          'Nêu mục đích thực hiện và thời gian/địa điểm.'
        ],
        thanbi: [
          'Phần chuẩn bị: Liệt kê nguyên vật liệu hoặc thành phần tham dự.',
          'Phần tiến trình: Hướng dẫn các bước chi tiết đánh số thứ tự khoa học, hoặc ghi lại phân công nhiệm vụ cụ thể.',
          'Phần kết quả: Sản phẩm tạo ra hoặc kết quả thảo luận đạt được.'
        ],
        ketbi: [
          'Khẳng định ý nghĩa và giá trị của công việc/buổi thảo luận.',
          'Niềm vui gắn kết tinh thần đoàn kết học tập tập thể.'
        ]
      },
      keywords: ['hướng dẫn', 'các bước', 'báo cáo', 'phân công', 'thảo luận', 'sản phẩm', 'đoàn kết'],
      errorsToAvoid: [
        'Tránh viết lan man giống kể chuyện dài dòng.',
        'Tránh thiếu các bước hướng dẫn hoặc thông tin phân công nhiệm vụ.'
      ]
    }
  };

  return genreData[type] || genreData['ta-cay-coi'];
}

function getMockEssay(topic: string, type: string, format: 'essay' | 'paragraph') {
  const cleanTopic = topic || 'Tả cảnh đồi chè quê em';
  
  const mockDatabase: Record<string, {
    essay: SampleEssayResult;
    paragraph: SampleEssayResult;
  }> = {
    'ta-cay-coi': {
      essay: {
        format: 'essay',
        content: `Trên sân trường em có trồng nhiều loài cây bóng mát, nhưng gần gũi và để lại ấn tượng sâu sắc nhất đối với em là cây bàng già ở góc sân. Cây bàng như một người bảo vệ khổng lồ, đứng sừng sững che chở cho chúng em suốt những năm tháng tiểu học.\n\nNhìn từ xa, cây bàng xum xuê như một chiếc ô xanh khổng lồ. Gốc cây to, rễ nổi lên mặt đất như những con rắn gỗ ngoằn ngoèo. Thân cây màu nâu xám, vỏ thô ráp sần sùi mang dấu vết của thời gian. Các cành bàng vươn rộng ra đóng góp bốn phía, đan xen nhau tạo nên tán lá dày đặc. Mùa xuân, cây bàng đâm chồi nảy lộc, những búp non xanh mướt mọc nhọn hoắt tràn đầy sức sống. Đến mùa hè, lá bàng chuyển màu xanh đậm, tán lá mát rượi đón những làn gió mùa hạ rì rào. Mỗi giờ ra chơi, chúng em lại tụ tập dưới gốc bàng vui đùa, đọc sách và nghe tiếng chim hót líu lo.\n\nCây bàng già không chỉ che bóng mát mà còn chứng kiến bao kỷ niệm vui buồn tuổi học trò của chúng em. Em rất yêu quý cây bàng và luôn tự nhủ sẽ cùng các bạn giữ gìn, không bẻ cành hái lá để cây luôn xanh tươi.`,
        highlights: [
          { text: "xum xuê như một chiếc ô xanh khổng lồ", type: "rhetorical", explanation: "Biện pháp so sánh làm nổi bật hình dáng tán lá rộng lớn và tác dụng che mát của cây bàng." },
          { text: "rễ nổi lên mặt đất như những con rắn gỗ ngoằn ngoèo", type: "rhetorical", explanation: "So sánh độc đáo miêu tả hình ảnh rễ cây sinh động, chân thực." },
          { text: "xanh mướt", type: "vocabulary", explanation: "Từ tả màu sắc xanh tươi non, tràn đầy sức sống của búp bàng non." }
        ],
        analysis: [
          "Bố cục 3 phần rõ ràng, chuyển ý mạch lạc từ tả bao quát đến chi tiết bộ phận và ích lợi của cây.",
          "Sử dụng từ láy miêu tả và hình ảnh so sánh sinh động giúp người đọc dễ hình dung dáng vẻ cây bàng.",
          "Lồng ghép kỷ niệm học trò và tình cảm gắn bó tha thiết của người viết ở phần kết bài."
        ]
      },
      paragraph: {
        format: 'paragraph',
        content: `Cây bàng góc sân trường em như một chiếc ô xanh khổng lồ che mát cho chúng em mỗi giờ ra chơi. Thân cây to bằng vòng tay em ôm, lớp vỏ xù xì thô ráp in hằn dấu vết thời gian. Những tán lá bàng xếp thành nhiều tầng rộng lớn, đan chặt vào nhau ngăn những tia nắng hè chói chang. Dưới bóng mát rượi của tán bàng rì rào gió thổi, chúng em vui đùa học tập, thắt chặt thêm tình bạn tuổi thơ thân thương mỗi ngày học đường.`,
        highlights: [
          { text: "như một chiếc ô xanh khổng lồ", type: "rhetorical", explanation: "So sánh tán cây bàng che chở học sinh như chiếc ô khổng lồ." },
          { text: "vỏ xù xì thô ráp", type: "vocabulary", explanation: "Từ miêu tả xúc giác rõ rệt đặc điểm thân cây bàng già." }
        ],
        analysis: [
          "Đoạn văn ngắn gọn, miêu tả được các nét đặc trưng của cây bàng từ thân, lá đến công dụng che mát.",
          "Cảm xúc lồng ghép tự nhiên thông qua hoạt động học đường."
        ]
      }
    },
    'ke-chuyen-da-doc-da-nghe': {
      essay: {
        format: 'essay',
        content: `Mẹ thường kể cho em nghe câu chuyện truyền thuyết "Sự tích hồ Ba Bể" đầy ý nghĩa. Câu chuyện dạy em bài học quý giá về lòng nhân ái, sẵn sàng giúp đỡ những người nghèo khổ và gặp khó khăn xung quanh mình.\n\nChuyện kể rằng, ở xã Nam Mẫu thuộc tỉnh Bắc Kạn có mở hội cúng Phật. Người người chen nhau đi lễ, bỗng nhiên có một bà cụ ăn xin già yếu, lếch thếch, người đầy mùi hôi thối đi vào xin ăn nhưng ai cũng xua đuổi. May sao, mẹ con bà góa tốt bụng đi chợ về thấy vậy đã đưa cụ về nhà, cho cụ ăn và cho cụ ngủ lại qua đêm. Đêm đó, chỗ bà cụ nằm bỗng hiện ra một con giao long lớn lấp lánh vảy, nhưng sáng ra vẫn chỉ thấy cụ ăn xin nằm ngủ. Khi chia tay, bà cụ đưa cho hai mẹ con gói tro và hai mảnh vỏ trấu, báo trước làng sắp có lũ lụt lớn. Đêm hội cúng Phật, dòng nước bỗng phun lên cuồn cuộn làm sập đổ nhà cửa. Mẹ con bà góa mang tro rắc quanh nhà và thả vỏ trấu hóa thành chiếc thuyền để chèo đi cứu giúp những người dân đang chìm trong nước lũ.\n\nCâu chuyện "Sự tích hồ Ba Bể" giải thích sự hình thành hồ nước tuyệt đẹp cùng lòng nhân ái của mẹ con bà góa. Tấm gương hiếu nghĩa tốt bụng ấy làm lòng em ấm áp lạ thường, tự hứa sẽ học tập tính yêu thương, giúp đỡ mọi người gặp nạn.`,
        highlights: [
          { text: "thả vỏ trấu hóa thành chiếc thuyền để chèo đi cứu giúp", type: "imagery", explanation: "Chi tiết kỳ ảo phản ánh hành động nhân đạo, cứu giúp đồng bào hoạn nạn." },
          { text: "bà cụ ăn xin già yếu, lếch thếch, người đầy mùi hôi thối", type: "imagery", explanation: "Tả chi tiết khắc họa hoàn cảnh thử thách lòng nhân ái của con người." },
          { text: "vô cùng tốt bụng, sẵn lòng giúp đỡ", type: "vocabulary", explanation: "Từ vựng bộc lộ sự ca ngợi đức tính tốt đẹp nhân hậu của nhân vật." }
        ],
        analysis: [
          "Bố cục kể câu chuyện mạch lạc, các sự việc sắp xếp đúng trình tự thời gian từ mở đầu, diễn biến đến kết thúc.",
          "Thể hiện rõ lòng nhân hậu đùm bọc đồng bào hoạn nạn của mẹ con bà góa.",
          "Nêu bài học đạo đức rõ ràng ý nghĩa sâu sắc."
        ]
      },
      paragraph: {
        format: 'paragraph',
        content: `Trong câu chuyện "Sự tích hồ Ba Bể", em xúc động nhất trước chi tiết mẹ con bà góa dùng hai mảnh vỏ trấu biến thành chiếc thuyền để chèo đi cứu vớt những người dân gặp nạn lụt. Mặc dù nhà mình cũng bị nước bao vây, hai mẹ con không hề mưu cầu tư lợi mà chỉ lo cứu người khác. Tấm lòng nhân ái bao la ấy của họ gieo vào lòng em niềm khâm phục sâu sắc, nhắc nhở em phải biết sẻ chia, đùm bọc những người xung quanh khi gặp khó khăn hoạn nạn.`,
        highlights: [
          { text: "chiếc thuyền để chèo đi cứu vớt những người dân gặp nạn", type: "imagery", explanation: "Chi tiết tả hành động dũng cảm nhân hậu cứu người." },
          { text: "lòng em ngập tràn niềm khâm phục sâu sắc", type: "emotion", explanation: "Bộc lộ trực tiếp cảm xúc mến mộ tình thương sâu sắc." }
        ],
        analysis: [
          "Đoạn văn tóm tắt ngắn gọn chi tiết cốt lõi và nêu rõ lý do yêu thích sâu sắc.",
          "Diễn đạt trôi chảy, giàu hình ảnh miêu tả cảm động."
        ]
      }
    },
    'cam-xuc-nhan-vat-van-hoc': {
      essay: {
        format: 'essay',
        content: `Trong những câu chuyện đã học ở lớp 4, nhân vật em bé hiếu thảo trong truyện cổ tích "Bông hoa cúc trắng" luôn để lại trong lòng em những xúc cảm sâu sắc và lòng kính phục vô hạn. Sự hiếu thảo ngoan ngoãn của em bé đã lay động trái tim em và dạy em bài học quý giá về bổn phận làm con.\n\nEm bé xuất hiện trong hoàn cảnh vô cùng đáng thương: mẹ bị bệnh nặng, nhà lại nghèo không có tiền mua thuốc chữa trị. Không quản rừng sâu âm u hiểm trở và thời tiết lạnh giá, em bé đã tự mình dũng cảm đi tìm thầy thuốc cứu mẹ. Chi tiết đắt giá nhất làm em rưng rưng nước mắt là khi em bé nhận được bông hoa cúc trắng từ cụ già tiên ông. Biết số cánh hoa tương ứng với số năm mẹ được sống, em bé đã nhanh trí, nhẹ nhàng xé từng cánh hoa thành những sợi nhỏ dài để mẹ được sống lâu muôn tuổi. Hành động ngây thơ mà vô cùng hiếu thảo đó đã làm lay động cả đất trời, cứu sống được mẹ.\n\nNhân vật em bé trong truyện "Bông hoa cúc trắng" là một tấm gương sáng ngời về tình yêu thương cha mẹ. Em tự hứa sẽ học tập chăm chỉ và ngoan ngoãn chăm sóc bố mẹ mỗi ngày để mang lại nhiều niềm vui cho gia đình thân yêu.`,
        highlights: [
          { text: "nhẹ nhàng xé từng cánh hoa thành những sợi nhỏ dài", type: "imagery", explanation: "Tả chi tiết hành động giàu tình thương và sự thông minh hiếu thảo của em bé." },
          { text: "rưng rưng nước mắt", type: "emotion", explanation: "Bộc lộ trực tiếp cảm xúc xúc động tự nhiên của người viết khi đọc truyện." }
        ],
        analysis: [
          "Trình bày tình cảm cảm xúc nhất quán đối với nhân vật em bé hiếu thảo.",
          "Phân tích hành động xé cánh hoa cúc - chi tiết biểu cảm đắt giá nhất của tác phẩm.",
          "Rút ra bài học đạo đức gia đình gần gũi thấm thía đối với học sinh lớp 4."
        ]
      },
      paragraph: {
        format: 'paragraph',
        content: `Đọc câu chuyện "Bông hoa cúc trắng", em vô cùng kính phục tấm lòng hiếu thảo của nhân vật em bé dành cho người mẹ bị ốm nặng. Hành động em bé cẩn thận xé từng cánh hoa cúc trắng thành nhiều sợi nhỏ dài để mong mẹ được sống thêm trăm tuổi đã chạm đến sâu thẳm tâm hồn em. Câu chuyện dạy em bài học quý báu về lòng hiếu thảo chăm sóc ông bà cha mẹ, thúc đẩy em tự giác rèn luyện chăm ngoan mỗi ngày học tập.`,
        highlights: [
          { text: "xé từng cánh hoa cúc trắng thành nhiều sợi nhỏ dài", type: "imagery", explanation: "Tả hành động cụ thể thể hiện tấm lòng hiếu thảo nghĩa hiệp của em nhỏ." },
          { text: "em vô cùng kính phục tấm lòng hiếu thảo", type: "emotion", explanation: "Cảm xúc tự hào, tôn kính nhân vật văn học." }
        ],
        analysis: [
          "Đoạn văn ngắn gọn làm bật phẩm chất hiếu kính nổi bật của nhân vật.",
          "Hành văn lưu loát trong sáng."
        ]
      }
    },
    'thuat-lai-su-viec': {
      essay: {
        format: 'essay',
        content: `Sáng Chủ nhật tuần trước, chi đội lớp 4A chúng em đã cùng nhau thực hiện một hoạt động vô cùng ý nghĩa: "Buổi lao động dọn vệ sinh lớp học". Buổi hoạt động ấy không chỉ giúp lớp học khang trang sạch đẹp mà còn để lại trong lòng em nhiều niềm vui đoàn kết ấm áp.\n\nĐúng 7 giờ 30 phút, các bạn học sinh đã tập trung đông đủ trước cửa lớp với chổi quét nhà, giẻ lau và xô nước nhỏ. Không khí chuẩn bị vô cùng rộn ràng, náo nức. Bạn lớp trưởng phân công cụ thể: Tổ 1 phụ trách quét màng nhện trần nhà và lau bảng đen; Tổ 2 lau chùi sạch sẽ hệ thống cửa sổ kính; Tổ 3 quét dọn nền nhà và lau sàn. Mỗi người một việc, chúng em nhanh nhẹn bắt tay vào việc. Em và Lan cùng lau cánh cửa sổ, đôi bàn tay phối hợp ăn ý lau đi lau lại giúp tấm kính trở nên sáng bóng trong suốt dưới nắng mai. Tiếng cười nói vui vẻ xôn xao hòa cùng tiếng chổi quét rào rạt làm rộn rã cả hành lang lớp học. Chỉ sau hai tiếng lao động hăng say, phòng học đã sạch sẽ tinh tươm, thơm tho hương nước lau sàn mát rượi.\n\nBuổi dọn vệ sinh kết thúc trong tiếng vỗ tay rộn rã và nụ cười rạng rỡ của cả lớp. Thuật lại sự việc dọn dẹp lớp học giúp em cảm nhận sâu sắc hơn niềm vui của việc lao động tập thể và ý thức giữ gìn vệ sinh chung trường lớp sạch đẹp.`,
        highlights: [
          { text: "Tổ 1 phụ trách quét... Tổ 2 lau chùi... Tổ 3 quét dọn", type: "imagery", explanation: "Thuật lại việc phân công lao động rõ ràng, khoa học tạo sự tin cậy." },
          { text: "rộn ràng, náo nức", type: "vocabulary", explanation: "Từ láy mô tả bầu không khí vui tươi phấn khởi của buổi lao động tập thể." },
          { text: "nụ cười rạng rỡ của cả lớp", type: "imagery", explanation: "Chi tiết tả hoạt động tinh thần phấn khởi sau khi hoàn thành việc tốt." }
        ],
        analysis: [
          "Bố cục rõ ràng 3 phần đầy đủ tiến trình trước, trong và sau hoạt động lao động dọn dẹp vệ sinh.",
          "Kết hợp miêu tả cảnh vật tươi sáng và tả hoạt động làm việc nhịp nhàng của học sinh.",
          "Bộc lộ niềm vui lao động và ý thức tự giác bảo vệ môi trường trường học tốt."
        ]
      },
      paragraph: {
        format: 'paragraph',
        content: `Tham gia buổi lao động dọn vệ sinh phòng học lớp 4A vào sáng Chủ nhật đã mang lại cho em những kỷ niệm vô cùng đáng nhớ. Dưới sự phân công nhịp nhàng của lớp trưởng, chúng em mỗi người một việc quét trần nhà, lau cửa kính và dọn dẹp bàn ghế sạch sẽ. Tiếng cười nói rộn vang xen lẫn tiếng chổi xào xạc làm xua tan đi mọi mệt mỏi. Nhìn phòng học sạch sẽ tinh tươm sau buổi lao động, lòng em ngập tràn niềm vui tự hào và thắt chặt tình cảm đoàn kết bè bạn dưới mái trường mến yêu.`,
        highlights: [
          { text: "quét trần nhà, lau cửa kính và dọn dẹp bàn ghế sạch sẽ", type: "imagery", explanation: "Thuật lại các công việc lao động cụ thể của học sinh tiểu học." },
          { text: "lòng em ngập tràn niềm vui tự hào", type: "emotion", explanation: "Bộc lộ cảm xúc vui tươi thoải mái sau khi hoàn tất công việc chung." }
        ],
        analysis: [
          "Đoạn văn ngắn gọn súc tích, thuật lại đầy đủ tiến trình chính của sự việc.",
          "Biểu lộ cảm xúc tự nhiên lành mạnh."
        ]
      }
    },
    'neu-y-kien-hien-tuong': {
      essay: {
        format: 'essay',
        content: `Trong cuộc sống hằng ngày, có một ý kiến cho rằng: "Học sinh tiểu học còn nhỏ tuổi, chỉ cần tập trung học tốt mà không cần tham gia làm việc nhà giúp đỡ cha mẹ". Em hoàn toàn không đồng tình với ý kiến này, bởi việc tự giác làm việc nhà vừa sức mang lại cho học sinh rất nhiều bài học quý giá để trưởng thành.\n\nLý lẽ đầu tiên của em là làm việc nhà thể hiện tình yêu thương và lòng biết ơn sâu sắc đối với cha mẹ. Hằng ngày, bố mẹ đã vất vả đi làm kiếm tiền nuôi nấng chúng em, việc chúng em rửa chén, quét nhà hay gấp quần áo sẽ chia sẻ bớt gánh nặng lam lũ cho cha mẹ. Thứ hai, làm việc nhà giúp học sinh lớp 4 rèn luyện tính tự lập và các kỹ năng sống cơ bản. Bản thân em, từ khi tự học cách nấu cơm và xếp dọn phòng riêng gọn gàng, em đã tự tin hơn mỗi khi bố mẹ vắng nhà đột xuất. Việc nhà vừa sức cũng là khoảng thời gian nghỉ ngơi thư giãn đầu óc bổ ích sau những giờ học căng thẳng trên lớp.\n\nTóm lại, tham gia làm việc nhà phụ giúp cha mẹ là việc làm vô cùng ý nghĩa và cần thiết. Mỗi học sinh lớp 4 hãy bắt đầu tự giác làm những việc nhỏ mỗi ngày để chia sẻ tình yêu thương trong gia đình.`,
        highlights: [
          { text: "hoàn toàn không đồng tình với ý kiến này", type: "rhetorical", explanation: "Khẳng định lập trường phản đối quan điểm thảo luận ngay từ mở bài nghị luận ý kiến." },
          { text: "chia sẻ bớt gánh nặng lam lũ cho cha mẹ", type: "vocabulary", explanation: "Từ vựng 'lam lũ' thể hiện sự đồng cảm sâu sắc với nỗi vất vả lao động của bố mẹ." },
          { text: "tự học cách nấu cơm và xếp dọn phòng riêng gọn gàng", type: "imagery", explanation: "Dẫn chứng từ đời sống thực tế chứng minh cho kỹ năng tự lập của học sinh tiểu học." }
        ],
        analysis: [
          "Lập luận chặt chẽ rõ ràng gồm hai lý lẽ cốt lõi kèm dẫn chứng thực tế thuyết phục.",
          "Lời văn khúc chiết mang tính thuyết phục cao phù hợp lứa tuổi học sinh lớp 4.",
          "Kết bài đề xuất thông điệp kêu gọi bạn bè cùng tự giác làm việc nhà giúp gia đình ấm áp."
        ]
      },
      paragraph: {
        format: 'paragraph',
        content: `Em hoàn toàn đồng trình với ý kiến cho rằng học sinh lớp 4 nên tự giác giúp đỡ cha mẹ làm những công việc nhà vừa sức. Việc quét dọn bàn ghế sạch sẽ, tưới hoa hay gấp quần áo ngăn nắp không chỉ thể hiện tình yêu thương lòng biết ơn của em dành cho bố mẹ, mà còn rèn luyện cho chúng em lối sống tự lập, gọn gàng. Lau dọn căn nhà nhỏ sạch sẽ lấp lánh nắng xuân giúp em cảm thấy vui vẻ và có trách nhiệm hơn với mái ấm gia đình của mình.`,
        highlights: [
          { text: "quét dọn bàn ghế sạch sẽ, tưới hoa hay gấp quần áo", type: "imagery", explanation: "Nêu các việc nhà vừa sức học sinh tiểu học có thể thực hành hằng ngày." },
          { text: "lòng biết ơn của em dành cho bố mẹ", type: "emotion", explanation: "Bày tỏ cảm xúc tình thương gia đình sâu đậm." }
        ],
        analysis: [
          "Đoạn văn nêu ý kiến rõ ràng thuyết phục, lý lẽ ngắn gọn đi đôi dẫn chứng thực tế ấm áp.",
          "Hành văn trong sáng trôi chảy."
        ]
      }
    },
    'neu-y-kien-cau-chuyen': {
      essay: {
        format: 'essay',
        content: `Trong thế giới truyện cổ dân gian kỳ ảo, câu chuyện "Sự tích dưa hấu" kể về nhân vật Mai An Tiêm dũng cảm vượt khó ở đảo hoang luôn là câu chuyện em yêu thích nhất. Câu chuyện hấp dẫn em bởi nội dung giàu ý nghĩa nhân văn sâu sắc và nhân vật có nghị lực phi thường đáng ngưỡng mộ.\n\nLý do đầu tiên làm em yêu thích câu chuyện là cốt truyện kịch tính chứa đựng bài học sâu sắc: "Có công mài sắt có ngày nên kim" hay lòng kiên trì sẽ chiến thắng mọi nghịch cảnh. Khi bị vua đày ra đảo hoang không có gì ăn ngoài cát trắng và biển cả, Mai An Tiêm không hề nản chí. Chi tiết đắt giá nhất là khi An Tiêm phát hiện ra bầy chim ăn hạt màu đen nhả lại trên bãi cát. Chú ý gieo trồng chăm sóc hạt giống ấy tỉ mỉ cho đến khi thu được những quả dưa hấu vỏ xanh ruột đỏ, vị ngọt lịm mát rượi. Sự chăm chỉ, kiên cường vượt khó đó giúp gia đình An Tiêm tồn tại vững vàng và cuối cùng được trở về đất liền sum họp.\n\nCâu chuyện "Sự tích dưa hấu" mãi là nguồn cảm hứng lớn bồi đắp lòng dũng cảm, tự lực cánh sinh vượt qua gian khổ cho em. Em rất thích câu chuyện này và luôn khuyên các bạn học sinh trong lớp tìm đọc tác phẩm này.`,
        highlights: [
          { text: "gieo trồng chăm sóc hạt giống ấy tỉ mỉ", type: "imagery", explanation: "Tả chi tiết hành động lao động cần cù vượt qua thử thách tự lập nơi hoang đảo." },
          { text: "vỏ xanh ruột đỏ, vị ngọt lịm mát rượi", type: "imagery", explanation: "Tả hình ảnh quả dưa hấu sinh động kích thích giác quan." },
          { text: "nghị lực phi thường đáng ngưỡng mộ", type: "vocabulary", explanation: "Từ vựng ca ngợi phẩm chất quý giá kiên cường của nhân vật Mai An Tiêm." }
        ],
        analysis: [
          "Nêu rõ tên truyện và lý do yêu thích câu chuyện một cách mạch lạc, đanh thép.",
          "Phân tích dẫn chứng chi tiết quả dưa hấu làm điểm tựa biểu lộ ý chí vượt lên nghịch cảnh.",
          "Kết bài kêu gọi chia sẻ câu chuyện ý nghĩa lan tỏa lối sống tự lập, kiên trì."
        ]
      },
      paragraph: {
        format: 'paragraph',
        content: `Em rất yêu thích câu chuyện cổ tích "Sự tích dưa hấu" vì câu chuyện kể về tinh thần tự lập kiên cường của nhân vật Mai An Tiêm. Khi bị đày ra đảo hoang nghèo khó, An Tiêm đã chăm chỉ trồng được giống dưa hấu vỏ xanh ruột đỏ ngọt mát từ hạt giống chim nhả trên cát. Chi tiết quả dưa hấu ngọt lịm mang tấm lòng trung hiếu gửi về đất liền làm em vô cùng khâm phục, dạy em bài học quý báu về tinh thần kiên trì học tập vượt qua bài toán khó mỗi ngày học đường.`,
        highlights: [
          { text: "dưa hấu vỏ xanh ruột đỏ ngọt mát từ hạt giống chim nhả", type: "imagery", explanation: "Tả chi tiết sự vật mấu chốt làm nổi bật nghị lực vượt khó của nhân vật." },
          { text: "dạy em bài học quý báu về tinh thần kiên trì", type: "emotion", explanation: "Bày tỏ bài học đúc kết sâu sắc từ ý kiến cá nhân." }
        ],
        analysis: [
          "Đoạn văn nêu lý do yêu thích ngắn gọn thuyết phục, hành văn truyền cảm.",
          "Lý lẽ rõ ràng đi liền với liên hệ thực tế học sinh lớp 4."
        ]
      }
    },
    'cam-xuc-nguoi-than': {
      essay: {
        format: 'essay',
        content: `Trong cả gia đình thân yêu, người gần gũi và yêu thương em nhất chính là người mẹ hiền hậu của em. Tình cảm sâu đậm cùng sự chăm sóc tảo tần hằng ngày của mẹ luôn nhen nhóm trong lòng em lòng biết ơn sâu sắc và tình yêu thương vô bờ bến.\n\nMẹ em năm nay hơn ba mươi tuổi, dáng người nhỏ nhắn hao gầy vì vất vả sớm hôm. Gương mặt mẹ phúc hậu với nụ cười dịu hiền luôn rạng rỡ chào đón em đi học về. Đặc biệt đáng nhớ đối với em là đôi bàn tay mẹ chai sạn, thô ráp vì làm việc lam lũ. Đôi bàn tay ấy hằng ngày nấu cho em những bữa cơm dẻo thơm, giặt sạch quần áo và ôm ấp em vỗ về mỗi khi em buồn. Em nhớ nhất kỷ niệm lần em bị sốt cao vào đêm lạnh, mẹ đã lo lắng thức suốt đêm chườm mát dỗ dành em từng thìa nước ấm với ánh mắt trìu mến đầy lo âu. Giọng nói truyền cảm trầm ấm của mẹ mỗi tối dạy em bài học đạo đức làm em thấy mình thật hạnh phúc.\n\nTình yêu thương hiền từ của mẹ như làn gió xuân ấm áp nuôi dưỡng em lớn khôn từng ngày. Em tự hứa sẽ học tập thật giỏi, chăm chỉ ngoan ngoãn vâng lời để đem lại thật nhiều điểm 10 đỏ chói mang về làm quà tri ân nụ cười ấm áp của mẹ kính yêu.`,
        highlights: [
          { text: "đôi bàn tay mẹ chai sạn, thô ráp vì làm việc lam lũ", type: "imagery", explanation: "Miêu tả đặc điểm bàn tay bộc lộ nỗi vất vả lo toan hy sinh hết lòng vì con của mẹ." },
          { text: "tảo tần", type: "vocabulary", explanation: "Từ láy bộc lộ sự chăm sóc đảm đang chịu thương chịu khó chăm lo gia đình của người phụ nữ." },
          { text: "lo lắng thức suốt đêm chườm mát dỗ dành em", type: "imagery", explanation: "Cử chỉ chăm sóc cụ thể làm nổi bật tình mẫu tử thiêng liêng ấm áp." }
        ],
        analysis: [
          "Biểu lộ cảm xúc yêu thương tôn kính mẹ nhất quán qua 3 phần bài văn tả tình cảm người thân.",
          "Sử dụng nhiều từ ngữ biểu cảm chân thực và chi tiết gợi nhớ chạm đến trái tim người đọc.",
          "Lời hứa rèn luyện ngoan ngoãn cuối bài thiết thực phù hợp lứa tuổi học sinh lớp 4."
        ]
      },
      paragraph: {
        format: 'paragraph',
        content: `Mẹ kính yêu của em có nụ cười hiền dịu tỏa nắng xua đi mọi buồn phiền mỗi khi em đi học về. Hằng ngày, đôi bàn tay thô ráp chai sần của mẹ tảo tần nấu từng bữa ăn ngọt lành ấm áp chăm lo cho gia đình. Sự chăm sóc ân cần trìu mến cùng ánh mắt biết nói rạng rỡ của mẹ tiếp thêm động lực cho em học tập thật tốt. Ngắm nhìn khuôn mặt phúc hậu hao gầy vì lo toan của mẹ, lòng em ngập tràn lòng biết ơn sâu sắc, tự hứa sẽ luôn chăm ngoan để mang lại niềm vui hạnh phúc cho mẹ yêu.`,
        highlights: [
          { text: "nụ cười hiền dịu tỏa nắng xua đi mọi buồn phiền", type: "imagery", explanation: "Mô tả hình ảnh nụ cười mẹ rạng rỡ xua tan mệt nhọc của con." },
          { text: "lòng em ngập tràn lòng biết ơn sâu sắc", type: "emotion", explanation: "Bày tỏ tình cảm trực tiếp sâu đậm đối với người thân yêu." }
        ],
        analysis: [
          "Đoạn văn viết xúc động, diễn đạt trôi chảy mạch lạc.",
          "Từ ngữ bộc lộ cảm xúc dồi dào tự nhiên."
        ]
      }
    },
    'viet-thu': {
      essay: {
        format: 'essay',
        content: `Hà Nội, ngày 16 tháng 6 năm 2026\n\nKhánh Linh thân mến,\n\nĐã lâu rồi từ ngày cậu chuyển trường vào Thành phố Hồ Chí Minh, chúng mình chưa có dịp gặp lại nhau. Hôm nay, nhân dịp cuối tuần rảnh rỗi, tớ viết bức thư này gửi bạn cũ để hỏi thăm sức khỏe và kể cho cậu nghe tình hình học tập lớp 4 của tớ ở trường cũ nhé.\n\nDạo này Khánh Linh có khỏe không? Việc học tập ở trường mới của cậu thế nào rồi? Cậu đã kết bạn được với nhiều người bạn mới chưa? Mọi người ở ngoài này vẫn thường nhắc và nhớ cậu lắm đấy. Về phần tớ, tớ vẫn khỏe mạnh và học tập chăm chỉ. Năm nay lên lớp 4, lượng bài học có nhiều và khó hơn một chút nhưng tớ đã cố gắng rất nhiều và đạt được danh hiệu Học sinh xuất sắc học kỳ vừa rồi đấy. Hằng ngày, ngoài giờ học, tớ còn tham gia câu lạc bộ bóng rổ của trường nữa. Tớ nhớ nhất kỷ niệm những buổi chiều hai đứa mình cùng nhau đọc sách truyện thiếu nhi dưới gốc cây bàng già góc sân trường, ước gì chúng mình lại được cùng nhau trò chuyện như xưa.\n\nThư đã dài, tớ xin dừng bút tại đây. Chúc Khánh Linh luôn mạnh khỏe, học tập thật giỏi và luôn mỉm cười nhé. Mong nhận được thư phản hồi kể về trường mới của cậu sớm nhất có thể.\n\nBạn thân của cậu:\nHiếu\nHoàng Trung Hiếu`,
        highlights: [
          { text: "Hà Nội, ngày 16 tháng 6 năm 2026", type: "imagery", explanation: "Phần mở đầu ghi rõ địa điểm và ngày tháng viết thư theo đúng quy chuẩn bức thư." },
          { text: "Khánh Linh thân mến", type: "vocabulary", explanation: "Lời xưng hô chào hỏi đầu thư thân thiện, phù hợp với đối tượng nhận thư là bạn học cũ." },
          { text: "đạt được danh hiệu Học sinh xuất sắc học kỳ vừa rồi", type: "imagery", explanation: "Thông báo kết quả học tập lớp 4 thiết thực chia sẻ niềm vui với bạn." }
        ],
        analysis: [
          "Đảm bảo cấu trúc bức thư chuẩn mực gồm Mở đầu (ngày tháng, chào hỏi), Nội dung chính (hỏi thăm, thông báo) và Cuối thư (chúc, hứa hẹn, chữ ký).",
          "Lời văn xưng hô tự nhiên thân thiện, bộc lộ tình bạn gắn bó chân thành.",
          "Nội dung thăm hỏi đầy đủ ý nghĩa phù hợp với chủ đề viết thư thăm bạn bè."
        ]
      },
      paragraph: {
        format: 'paragraph',
        content: `Viết thư cho người bạn cũ Khánh Linh ở xa làm em cảm thấy ngập tràn cảm xúc nhớ nhung tuổi thơ. Sau khi ghi dòng chữ Hà Nội ngày tháng năm và lời xưng hô chào hỏi đầu thư thân mến ở mở đầu, em viết nội dung thăm hỏi sức khỏe của bạn rồi kể về những thay đổi học tập lớp 4 của mình. Gửi gắm những ước mong sớm ngày sum họp và lời hứa cùng nhau thi đua tiến bộ ở cuối thư giúp tình bạn của hai chúng em luôn bền chặt gắn kết qua năm tháng dù cách xa địa lý.`,
        highlights: [
          { text: "Khánh Linh ở xa làm em cảm thấy ngập tràn cảm xúc nhớ nhung", type: "emotion", explanation: "Bộc lộ trực tiếp cảm xúc nhớ bạn chân thành." },
          { text: "Hà Nội ngày tháng năm và lời xưng hô chào hỏi đầu thư", type: "imagery", explanation: "Đề cập các yếu tố bắt buộc của cấu trúc viết thư." }
        ],
        analysis: [
          "Đoạn văn giới thiệu được mục đích và ý nghĩa cấu trúc bức thư.",
          "Diễn đạt logic mạch lạc."
        ]
      }
    },
    'viet-don': {
      essay: {
        format: 'essay',
        content: `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc\n\nHà Nội, ngày 16 tháng 6 năm 2026\n\nĐƠN XIN GIA NHẬP CÂU LẠC BỘ BÓNG ĐÁ\n\nKính gửi: Ban phụ trách Câu lạc bộ thể thao trường Tiểu học Ban Mai.\n\nEm tên là: Hoàng Trung Hiếu\nSinh ngày: 20 tháng 10 năm 2016\nHọc sinh lớp: 4A trường Tiểu học Ban Mai.\n\nSau khi nghe thông báo tuyển thành viên cho Câu lạc bộ bóng đá của trường, em viết đơn này kính gửi Ban phụ trách câu lạc bộ xin được đăng ký gia nhập câu lạc bộ thể chất lớp 4.\n\nLý do em làm đơn: Từ nhỏ em đã rất đam mê bộ môn bóng đá, thường xuyên tham gia đá bóng cùng các bạn vào mỗi buổi chiều để rèn luyện sức khỏe. Em nhận thấy câu lạc bộ bóng đá của trường là môi trường rèn luyện vô cùng bổ ích giúp em nâng cao kỹ năng thể thao và tinh thần phối hợp đồng đội.\n\nNếu được gia nhập câu lạc bộ, em xin cam kết:\n1. Chấp hành nghiêm chỉnh nội quy và lịch sinh hoạt luyện tập của câu lạc bộ.\n2. Tích cực tham gia các buổi tập luyện và thi đấu giao hữu sôi nổi.\n3. Luôn giữ gìn đoàn kết, giúp đỡ đồng đội tiến bộ.\n\nEm xin chân thành cảm ơn Ban phụ trách câu lạc bộ.\n\nNgười làm đơn:\nHiếu\nHoàng Trung Hiếu`,
        highlights: [
          { text: "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc", type: "imagery", explanation: "Đảm bảo đúng quy chuẩn Quốc hiệu và Tiêu ngữ ở phần đầu văn bản hành chính." },
          { text: "ĐƠN XIN GIA NHẬP CÂU LẠC BỘ BÓNG ĐÁ", type: "vocabulary", explanation: "Tên đơn viết in hoa nổi bật, đặt ở giữa dòng thể hiện tính trang trọng khoa học." },
          { text: "Chấp hành nghiêm chỉnh nội quy và lịch sinh hoạt", type: "vocabulary", explanation: "Lời cam kết tự giác, có trách nhiệm của học sinh tiểu học khi viết đơn." }
        ],
        analysis: [
          "Bố cục đơn hành chính hoàn chỉnh chuẩn mực: Quốc hiệu tiêu ngữ, ngày tháng, tên đơn, kính gửi, thông tin cá nhân, lý do viết đơn, cam kết và chữ ký người viết.",
          "Hành văn ngắn gọn, trang trọng, trình bày rõ ý, đúng văn phong hành chính.",
          "Thể hiện rõ nguyện vọng chính đáng phù hợp lứa tuổi học sinh lớp 4."
        ]
      },
      paragraph: {
        format: 'paragraph',
        content: `Viết đơn xin gia nhập câu lạc bộ bóng đá của trường giúp em rèn luyện kỹ năng viết văn bản hành chính chuẩn mực. Bắt đầu bằng dòng Quốc hiệu Tiêu ngữ trang trọng, tên đơn viết in hoa ĐƠN XIN GIA NHẬP và phần kính gửi gửi Ban phụ trách thể thao, đơn cần nêu rõ họ tên ngày sinh học sinh lớp 4. Trình bày lý do đam mê bóng đá và cam kết rèn luyện tự giác giúp thể hiện tinh thần trách nhiệm, mong muốn tham gia thể chất lành mạnh.`,
        highlights: [
          { text: "ĐƠN XIN GIA NHẬP và phần kính gửi gửi Ban phụ trách", type: "imagery", explanation: "Mô tả phần tiêu đề đơn kính gửi đúng quy cách." },
          { text: "cam kết rèn luyện tự giác giúp thể hiện tinh thần trách nhiệm", type: "vocabulary", explanation: "Từ vựng bộc lộ sự trưởng thành tự ý thức của học sinh tiểu học." }
        ],
        analysis: [
          "Đoạn văn thuật lại rõ ràng mục đích cấu trúc viết đơn hành chính.",
          "Hành văn rõ ràng rành mạch."
        ]
      }
    },
    'ta-con-vat': {
      essay: {
        format: 'essay',
        content: `Trong thế giới loài vật nuôi thân thuộc, chú mèo mướp tên là Bông của gia đình em luôn là con vật em yêu mến nhất. Bông không chỉ là chú mèo bắt chuột giỏi mà còn là người bạn nhỏ vô cùng đáng yêu luôn đem lại tiếng cười vui vẻ cho cả nhà.\n\nBông có vóc dáng nhỏ nhắn, nặng khoảng ba ki-lô-gam. Bộ lông chú có màu xám tro pha lẫn những vệt vằn đen mềm mại như dải nhung ấm áp. Cái đầu tròn xoe bằng quả cam với đôi tai vểnh lên nghe ngóng âm thanh nhạy bén. Đôi mắt Bông tròn xoe, trong xanh như hai viên bi thủy tinh sáng quắc giúp chú rình bắt chuột vô cùng tài tình trong bóng tối. Bốn chiếc chân thon thả, bước đi nhẹ nhàng không tiếng động nhờ lớp đệm thịt êm ái dưới bàn chân cùng bộ móng vuốt sắc nhọn giấu kín. Cái đuôi dài dài, thướt tha cứ nguây nguẩy mỗi khi chú muốn nũng nịu cọ đầu vào chân em. Mỗi buổi sáng mùa đông ấm áp, Bông thích sưởi nắng bên hiên nhà, đôi mắt chú híp lại rim rim tận hưởng làn sương ban mai dịu mát.\n\nEm yêu Bông lắm! Em thường giúp mẹ cho Bông ăn cơm cá ngon lành hằng ngày và vuốt ve âu yếm bộ lông mềm mại của chú. Chú mèo mướp như một thành viên đáng quý mang tình cảm ấm lòng gắn kết tình yêu động vật trong gia đình em.`,
        highlights: [
          { text: "đôi mắt tròn xoe, trong xanh như hai viên bi thủy tinh sáng quắc", type: "rhetorical", explanation: "Biện pháp so sánh ví đôi mắt mèo sáng lung linh như bi thủy tinh giúp mô tả rõ nét vẻ nhanh nhẹn lanh lợi." },
          { text: "nguây nguẩy mỗi khi chú muốn nũng nịu cọ đầu", type: "imagery", explanation: "Tả hoạt động tinh nghịch đáng yêu biểu lộ sự gắn bó gần gũi với con người." },
          { text: "vô cùng đáng yêu luôn đem lại tiếng cười", type: "vocabulary", explanation: "Từ vựng biểu lộ tình cảm trân quý, xem thú cưng như thành viên gia đình." }
        ],
        analysis: [
          "Bố cục văn tả con vật hoàn chỉnh, tả đầy đủ ngoại hình kết hợp cử chỉ hoạt động đặc trưng đáng yêu của con mèo.",
          "Sử dụng nhiều từ ngữ tả âm thanh, hình ảnh so sánh sinh động giúp bài văn cuốn hút trẻ thơ.",
          "Thể hiện tình cảm gắn bó, chăm sóc ân cần đối với động vật có ý nghĩa giáo dục."
        ]
      },
      paragraph: {
        format: 'paragraph',
        content: `Chú mèo mướp tên Bông của nhà em có bộ lông xám tro mềm mại với đôi mắt tròn xoe sáng quắc như hai viên bi thủy tinh lấp lánh dưới nắng mai. Mỗi chiều đi học về, chú ta thoăn thoắt chạy ra cửa vẫy đuôi nũng nịu cọ đầu vào chân em đón chào mừng rỡ. Nhìn chú ngoan ngoãn bắt chuột giỏi giúp nhà cửa sạch sẽ và cuộn tròn sưởi nắng se se lạnh bên hiên, lòng em dâng tràn tình cảm yêu thương động vật sâu sắc, tự hứa sẽ chăm sóc chú thật tốt mỗi ngày.`,
        highlights: [
          { text: "đôi mắt tròn xoe sáng quắc như hai viên bi thủy tinh", type: "rhetorical", explanation: "So sánh mắt mèo giúp nổi bật vẻ tinh nhanh lanh lợi." },
          { text: "thoăn thoắt chạy ra cửa vẫy đuôi nũng nịu cọ đầu", type: "imagery", explanation: "Hành động thân thiết tình cảm giữa vật và người chủ." }
        ],
        analysis: [
          "Đoạn văn tả mèo sinh động, bộc lộ tình cảm gắn bó tự nhiên.",
          "Từ ngữ chọn lọc tinh tế, biểu đạt tự nhiên."
        ]
      }
    },
    'viet-huong-dan-bao-cao': {
      essay: {
        format: 'essay',
        content: `Gấp đồ chơi giấy là trò chơi thủ công sáng tạo mà học sinh lớp 4 chúng em rất yêu thích. Hôm nay, em xin hướng dẫn các bạn từng bước gấp một chiếc thuyền giấy có buồm đơn giản nhất để trang trí hoặc thả chơi dưới nước.\n\nTrước tiên, về Nguyên vật liệu chuẩn bị: Các bạn cần chuẩn bị một tờ giấy hình chữ nhật màu trắng hoặc giấy thủ công có màu sắc tươi sáng tùy thích. Các bước thực hiện chi tiết như sau:\n- Bước 1: Gấp đôi tờ giấy theo chiều ngang để tạo nếp gấp ở giữa.\n- Bước 2: Gấp hai góc trên của tờ giấy hướng vào nếp gấp giữa để tạo thành hình tam giác nhọn ở đỉnh.\n- Bước 3: Gấp mép giấy phía dưới lên hai bên mặt của hình tam giác để khóa nếp gấp lại.\n- Bước 4: Nhẹ nhàng mở rộng lòng chiếc nón giấy vừa gấp rồi bẻ chéo ngược lại để tạo thành hình vuông nhỏ.\n- Bước 5: Tiếp tục gấp hai góc dưới của hình vuông lên phía trên tạo thành hình tam giác nhỏ hơn.\n- Bước 6: Dùng đôi tay khéo léo nhẹ nhàng kéo hai mép giấy ở đỉnh sang hai bên để mở bung chiếc thuyền giấy xinh xắn có buồm mọc sừng sững ở giữa.\n\nChiếc thuyền giấy hoàn thành xinh xắn giúp chúng em rèn luyện đôi tay khéo léo kiên trì. Hướng dẫn các bước gấp thuyền giấy khoa học giúp các bạn dễ dàng thực hiện thành công để có những giờ vui chơi học tập sáng tạo bổ ích.`,
        highlights: [
          { text: "Bước 1: Gấp đôi tờ giấy... Bước 2: Gấp hai góc...", type: "imagery", explanation: "Đánh số thứ tự các bước hướng dẫn cụ thể giúp người đọc dễ làm theo." },
          { text: "dùng đôi tay khéo léo nhẹ nhàng kéo hai mép giấy", type: "vocabulary", explanation: "Từ ngữ gợi tả hành động thủ công khéo léo, mang tính hướng dẫn thực hành cao." },
          { text: "thuyền giấy xinh xắn có buồm mọc sừng sững", type: "imagery", explanation: "Tả hình ảnh sản phẩm hoàn thiện giúp người đọc mường tượng kết quả." }
        ],
        analysis: [
          "Bố cục bản hướng dẫn rõ ràng gồm Mục đích, Chuẩn bị nguyên liệu và Các bước tiến hành logic.",
          "Hành văn ngắn gọn, dễ hiểu, các bước hướng dẫn xếp theo đúng quy trình thực hành.",
          "Tính thực tiễn cao, giúp rèn luyện tư duy logic khoa học cho học sinh tiểu học."
        ]
      },
      paragraph: {
        format: 'paragraph',
        content: `Viết hướng dẫn các bước gấp chiếc thuyền giấy giúp em sắp xếp quy trình làm việc thủ công một cách khoa học rõ ràng. Sau khi nêu khâu chuẩn bị tờ giấy màu hình chữ nhật phẳng phiu ở mở đầu, em hướng dẫn chi tiết các bước từ gấp đôi giấy, tạo hình tam giác đỉnh nhọn, bẻ mép khóa giấy đến bước kéo nhẹ hai góc ra để chiếc thuyền có cánh buồm sừng sững xuất hiện. Quy trình các bước mạch lạc giúp các bạn tự làm được món đồ chơi thú vị và rèn luyện tính kiên nhẫn.`,
        highlights: [
          { text: "gấp đôi giấy, tạo hình tam giác đỉnh nhọn, bẻ mép khóa giấy", type: "imagery", explanation: "Nêu các bước thao tác kỹ thuật gấp giấy cụ thể." },
          { text: "sắp xếp quy trình làm việc thủ công một cách khoa học", type: "vocabulary", explanation: "Khái quát lợi ích logic của việc viết hướng dẫn chỉ dẫn." }
        ],
        analysis: [
          "Đoạn văn tóm tắt rõ ràng mục đích cấu trúc bản hướng dẫn các bước.",
          "Hành văn mạch lạc, ngôn từ dễ hiểu."
        ]
      }
    }
  };

  const genreEntry = mockDatabase[type] || mockDatabase['ta-cay-coi'];
  const essayResult = genreEntry[format] || genreEntry['essay'];
  return { ...essayResult, isSimulated: true };
}

// 1. AI Outline Generation Endpoint
app.post('/api/gemini/generate', async (req, res) => {
  const { topic, type, model } = req.body;
  if (!topic) {
    return res.status(400).json({ error: 'Chủ đề đề bài (topic) không được để trống' });
  }

  const clientApiKey = req.headers['x-api-key'] as string | undefined;
  const client = getGeminiClient(clientApiKey);
  if (!client) {
    // Return high-quality mock data when key is missing so development preview never stays stuck
    return res.json(getMockOutline(topic, type));
  }

  try {
    const prompt = `Bạn là chuyên gia giáo dục tiểu học hỗ trợ dạy Tiếng Việt viết văn lớp 4.
Hãy phân tích đề bài sau và trả về phản hồi dưới dạng JSON chính xác:
Đề bài: "${topic}"
Dạng bài tương ứng: ${type} (Có thể là: ta-cay-coi, ke-chuyen-da-doc-da-nghe, cam-xuc-nhan-vat-van-hoc, thuat-lai-su-viec, neu-y-kien-hien-tuong, neu-y-kien-cau-chuyen, cam-xuc-nguoi-than, viet-thu, viet-don, ta-con-vat, viet-huong-dan-bao-cao)

Hãy trả về một đối tượng JSON có cấu trúc chính xác sau đây (không có markdown khác ngoài văn bản bên trong thuộc tính JSON):
{
  "genre": "Tên tiếng Việt hiển thị của dạng bài (ví dụ: Văn tả cảnh)",
  "requirements": ["Danh sách 3-4 yêu cầu quan trọng cần có khi làm đề bài này"],
  "outline": {
    "mobi": ["Danh sách 2-3 ý chính của phần Mở bài"],
    "thanbi": ["Danh sách 4-5 ý chính của phần Thân bài, có thể bắt đầu bằng chữ số"],
    "ketbi": ["Danh sách 1-2 ý chính của phần Kết bài"]
  },
  "keywords": ["Danh sách 5-8 từ khóa, từ láy miêu tả hoặc bày tỏ cảm xúc đắt giá cần dùng"],
  "errorsToAvoid": ["Danh sách 2-3 lỗi học sinh hay mắc phải đối với đề tài này"]
}`;

    const textRes = await generateWithFallback(client, model, prompt, {
      responseMimeType: 'application/json',
      temperature: 0.7,
    });
    const cleanedJson = cleanJsonResponse(textRes);
    const data = JSON.parse(cleanedJson);
    return res.json(data);
  } catch (err: any) {
    console.error('Gemini Generate Outline Error:', err);
    const hasApiKey = !!(clientApiKey || process.env.GEMINI_API_KEY);
    if (hasApiKey) {
      return res.status(500).json({ error: `Gemini API Error: ${err.message || err}` });
    }
    return res.status(200).json(getMockOutline(topic, type));
  }
});

// 1.5. AI Exemplary Essay/Paragraph Generation Endpoint
app.post('/api/gemini/essay', async (req, res) => {
  const { topic, type, format, outline, model } = req.body;
  if (!topic) {
    return res.status(400).json({ error: 'Chủ đề đề bài không được để trống' });
  }

  const clientApiKey = req.headers['x-api-key'] as string | undefined;
  const client = getGeminiClient(clientApiKey);
  if (!client) {
    return res.json(getMockEssay(topic, type, format || 'essay'));
  }

  try {
    const prompt = `Bạn là một nhà văn thiếu nhi đoạt giải thưởng lớn và là chuyên gia giáo dục Tiếng Việt lớp 4 ưu tú.
Hãy viết một bài văn mẫu hoàn chỉnh hoặc một đoạn văn ngắn đạt loại xuất sắc (điểm 10/10 tuyệt đối) dựa trên chủ đề và dàn ý cho trước.

Yêu cầu về chất lượng bài viết:
1. Chuẩn mực về ngữ pháp Tiếng Việt lớp 4, hành văn trong sáng, giàu nhạc điệu, giàu cảm xúc chân thành và hình ảnh sống động phù hợp lứa tuổi học sinh tiểu học.
2. Thể hiện rõ các biện pháp tu từ tiêu biểu (So sánh, Nhân hóa, Điệp từ/điệp ngữ) và sử dụng từ láy đắt giá để tăng chiều sâu nghệ thuật.
3. Nếu định dạng là 'essay' (bài văn), bắt buộc phải có đầy đủ 3 phần (Mở bài, Thân bài, Kết bài) phân đoạn rõ ràng bằng ký tự xuống dòng.
4. Nếu định dạng là 'paragraph' (đoạn văn), viết một đoạn văn liền mạch duy nhất không xuống dòng, tập trung thể hiện sâu sắc một khía cạnh nổi bật.
5. Nếu có dàn ý của học sinh ('outline') kèm theo, hãy lấy cảm hứng viết bám sát theo các ý chính trong dàn ý đó nhưng nâng tầm ngôn từ lên loại giỏi để học sinh noi theo.

Chủ đề: "${topic}"
Dạng bài tương ứng: ${type}
Định dạng yêu cầu: ${format === 'essay' ? 'Bài văn hoàn chỉnh' : 'Đoạn văn ngắn'}
Dàn ý của học sinh (nếu có): "${outline || 'Không có dàn ý, hãy viết tự do theo chủ đề'}"

BẮT BUỘC TRẢ VỀ kết quả duy nhất dưới dạng một đối tượng JSON chính xác (không chứa bất kỳ chữ hay markdown nào khác ngoài khối JSON):
{
  "format": "${format || 'essay'}",
  "content": "Nội dung bài viết mẫu viết bằng Tiếng Việt. Để hiển thị tốt, hãy giữ các ký tự xuống dòng '\\\\n\\\\n' phân đoạn rõ ràng nếu là bài văn.",
  "highlights": [
    {
      "text": "cụm từ hoặc câu văn cụ thể có trong nội dung trên cần được tô sáng",
      "type": "imagery" (từ gợi hình, hình ảnh) hoặc "emotion" (từ/câu biểu đạt cảm xúc) hoặc "rhetorical" (biện pháp nghệ thuật so sánh, nhân hóa, điệp từ) hoặc "vocabulary" (từ láy hoặc từ vựng đắt giá),
      "explanation": "Lời giải thích sư phạm ngắn gọn, dễ hiểu của Cú Văn giải thích vì sao câu/từ này lại hay và học sinh nên học hỏi điều gì."
    }
  ],
  "analysis": [
    "Nhận xét tinh hoa thứ 1: ví dụ về bố cục, sự dẫn dắt cảm xúc...",
    "Nhận xét tinh hoa thứ 2: ví dụ về việc sử dụng các từ láy và biện pháp nghệ thuật...",
    "Nhận xét tinh hoa thứ 3: ví dụ về bài học/thông điệp nhân văn đọng lại..."
  ]
}`;

    const textRes = await generateWithFallback(client, model, prompt, {
      responseMimeType: 'application/json',
      temperature: 0.7,
    });
    const cleanedJson = cleanJsonResponse(textRes);
    const data = JSON.parse(cleanedJson);
    return res.json(data);
  } catch (err: any) {
    console.error('Gemini Generate Essay Error:', err);
    const hasApiKey = !!(clientApiKey || process.env.GEMINI_API_KEY);
    if (hasApiKey) {
      return res.status(500).json({ error: `Gemini API Error: ${err.message || err}` });
    }
    return res.status(200).json(getMockEssay(topic, type, format || 'essay'));
  }
});

// 2. AI Grading Rubric Evaluation Endpoint
app.post('/api/gemini/grade', async (req, res) => {
  const { topic, type, outline, model } = req.body;
  if (!topic || !outline) {
    return res.status(400).json({ error: 'Chủ đề đề bài và Dàn ý không được để trống' });
  }

  const clientApiKey = req.headers['x-api-key'] as string | undefined;
  const client = getGeminiClient(clientApiKey);
  if (!client) {
    // Return high-quality mock evaluation
    const scoreVal = outline.length > 100 ? 84 : 68;
    return res.json({
      score: scoreVal,
      criteriaScores: {
        understand: Math.round(scoreVal * 0.2),
        structure: Math.round(scoreVal * 0.2),
        development: Math.round(scoreVal * 0.25),
        creativity: Math.round(scoreVal * 0.2),
        logic: Math.round(scoreVal * 0.15)
      },
      feedback: {
        general: scoreVal >= 80 
          ? 'Ý tưởng bài viết của em khá phong phú, bộc lộ được xúc cảm sâu sắc và chân thực của lứa tuổi học sinh lớp 4.' 
          : 'Dàn ý của em đã có đủ 3 phần cơ bản nhưng cần phát triển thêm những chi tiết miêu tả và cảm thụ sinh động hơn.',
        strengths: [
          'Đã xác định đúng kiểu bài học sinh lớp 4.',
          'Bố cục ba phần rành mạch vững chãi.',
          'Bộc lộ cảm xúc tự nhiên, mộc mạc.'
        ],
        improvements: [
          'Cần bổ sung thêm các hình ảnh chi tiết giàu liên tưởng.',
          'Hãy đa dạng hóa các tính từ màu sắc hoặc âm thanh đặc tả để bài viết sinh động hơn.'
        ],
        nextSteps: 'Hãy thử viết thêm 2-3 ý cụ thể làm rõ chi tiết "âm thanh xôn xao" và nộp lại ở phiên bản sửa đổi (Lần 2) để thấy sự tiến bộ nhé!'
      },
      checklist: [
        { name: 'Xác định rõ ràng bối cảnh', status: true },
        { name: 'Phát triển ý chi tiết', status: outline.length > 120 },
        { name: 'Sử dụng từ ngữ biểu cảm', status: outline.length > 80 },
        { name: 'Có bài học trải nghiệm sâu sắc', status: outline.includes('bài học') || outline.includes('em hứa') || outline.length > 100 }
      ]
    });
  }

  try {
    const prompt = `Bạn là huấn luyện viên viết văn Tiếng Việt lớp 4 thông thái.
Hãy chấm điểm dàn ý của học sinh theo thang điểm 100 dựa trên rubric này:
1. Hiểu đề và xác định đúng yêu cầu (tối đa 20 điểm)
2. Cấu trúc, bố cục dàn ý 3 phần (tối đa 20 điểm)
3. Phát triển ý chính, ý phụ, mức độ chi tiết (tối đa 25 điểm)
4. Sự xuất hiện của cảm xúc / quan điểm / sáng tạo (tối đa 20 điểm)
5. Tính logic và khả năng triển khai thành bài viết (tối đa 15 điểm)

Đề bài: "${topic}"
Dạng bài tương ứng: ${type}
Nội dung dàn ý học sinh nhập:
"${outline}"

Hãy đánh giá cẩn thận và trả về cấu trúc JSON duy nhất sau (không chứa các khối markdown hay chữ khác ngoài thuộc tính JSON):
{
  "score": 85, // Tổng điểm thực tế (chỉ số integer từ 0 đến 100)
  "criteriaScores": {
    "understand": 18, // điểm thực tế cột 1 (tối đa 20)
    "structure": 17, // điểm thực tế cột 2 (tối đa 20)
    "development": 20, // điểm thực tế cột 3 (tối đa 25)
    "creativity": 16, // điểm thực tế cột 4 (tối đa 20)
    "logic": 14 // điểm thực tế cột 5 (tối đa 15)
  },
  "feedback": {
    "general": "Lời nhận xét tổng quan khích lệ tinh thần, súc tích dành cho học sinh lớp 4.",
    "strengths": ["Điểm mạnh 1 rõ nét", "Điểm mạnh 2 rõ nét"],
    "improvements": ["Nội dung cần bổ sung 1", "Nội dung cần bổ sung 2"],
    "nextSteps": "Gợi ý nhiệm vụ nâng cấp cụ thể để sửa đổi cho bài viết tốt hơn"
  },
  "checklist": [
    {"name": "Tiêu chí checklist 1 liên đới riêng biệt dạng bài (ví dụ: Tả bao quát cảnh)", "status": true},
    {"name": "Tiêu chí checklist 2 (ví dụ: Sử dụng từ láy, biện pháp so sánh)", "status": false},
    {"name": "Tiêu chí checklist 3 (ví dụ: Thể hiện cảm xúc chân thực)", "status": true}
  ]
}`;

    const textRes = await generateWithFallback(client, model, prompt, {
      responseMimeType: 'application/json',
      temperature: 0.6,
    });
    const data = JSON.parse(cleanJsonResponse(textRes));
    return res.json(data);
  } catch (err: any) {
    console.error('Gemini grading error:', err);
    const hasApiKey = !!(clientApiKey || process.env.GEMINI_API_KEY);
    if (hasApiKey) {
      return res.status(500).json({ error: `Gemini API Error: ${err.message || err}` });
    }
    return res.json({
      score: 75,
      criteriaScores: { understand: 16, structure: 16, development: 18, creativity: 14, logic: 11 },
      feedback: {
        general: 'Bài của em có ý hay nhưng cần bổ sung các cụm từ đắt giá.',
        strengths: ['Đúng dạng bài', 'Bố cục rõ ràng'],
        improvements: ['Bổ sung thêm từ láy, hình ảnh so sánh', 'Nêu rõ cảm nghĩ ở kết bài'],
        nextSteps: 'Hãy bổ sung từ láy và hình ảnh miêu tả để bài viết cuốn hút hơn.'
      },
      checklist: [{ name: 'Có mở bài', status: true }, { name: 'Thân bài chi tiết', status: false }]
    });
  }
});

// 3. AI Growth Tracker Comparison Endpoint (Before vs After)
app.post('/api/gemini/compare', async (req, res) => {
  const { topic, type, outlineBefore, outlineAfter, gradeBefore, model } = req.body;
  if (!topic || !outlineBefore || !outlineAfter) {
    return res.status(400).json({ error: 'Thiếu dữ liệu để so sánh dàn ý trước sau' });
  }

  const scoreBefore = gradeBefore?.score || 65;
  const skillsBefore = gradeBefore?.criteriaScores || {
    understand: 14,
    structure: 14,
    development: 16,
    creativity: 12,
    logic: 9
  };

  const clientApiKey = req.headers['x-api-key'] as string | undefined;
  const client = getGeminiClient(clientApiKey);
  if (!client) {
    // Generate high-quality growth comparison mock
    const scoreAfter = Math.min(scoreBefore + 18, 98);
    const scoreDiff = scoreAfter - scoreBefore;

    const compFeedback: Record<string, { celebration: string; reminders: string; growthWords: string }> = {
        'ta-cay-coi': {
          celebration: `Tuyệt vời quá! Em đã tăng tận ${scoreDiff} điểm! Thân bài của em từ chỗ chỉ giới thiệu sơ sài giờ đã sống động hơn hẳn nhờ bổ sung các hình ảnh tả dáng cây sắc nét, ích lợi cụ thể và màu sắc tự nhiên.`,
          reminders: 'Em hãy lưu ý sắp xếp thứ tự miêu tả theo một trình tự hợp lý (từ xa đến gần hoặc theo bộ phận) để chuyển ý mượt mà hơn nhé.',
          growthWords: 'Em đã trưởng thành từ việc quan sát cây cối chung chung thành một người quan sát nhạy bén, biết tả chi tiết sinh động.'
        },
        'ke-chuyen-da-doc-da-nghe': {
          celebration: `Quá xuất sắc! Dàn ý của em đã tăng tận ${scoreDiff} điểm! Câu chuyện kể của em trở nên lôi cuốn và rõ ràng hơn rất nhiều nhờ sắp xếp các sự việc theo đúng tiến trình thời gian hợp lý.`,
          reminders: 'Đừng quên dùng lời văn tự nhiên của mình thay vì chép y nguyên sách để câu chuyện sinh động và chân thực hơn nhé.',
          growthWords: 'Em có khả năng nhớ và truyền đạt cốt truyện rất tốt, biết cách sắp xếp diễn biến hợp lý để tạo sự tò mò cho người đọc.'
        },
        'cam-xuc-nhan-vat-van-hoc': {
          celebration: `Tuyệt vời quá! Em đã tăng tận ${scoreDiff} điểm! Dàn ý đã sâu sắc hơn rất nhiều nhờ bổ sung các dẫn chứng cụ thể về hành động, phẩm chất của nhân vật và lý giải rõ cảm xúc yêu quý của mình.`,
          reminders: 'Hãy liên hệ thực tế một cách tự nhiên hơn, rút ra bài học ứng xử từ nhân vật gần gũi với cuộc sống của chính em nhé.',
          growthWords: 'Em đã thể hiện khả năng cảm nhận văn học tinh tế, biết đồng cảm và trân trọng những đức tính tốt đẹp của nhân vật.'
        },
        'thuat-lai-su-viec': {
          celebration: `Thật đáng khen! Em đã tăng tận ${scoreDiff} điểm! Dàn ý của em đã truyền tải được trọn vẹn tiến trình sự việc từ khâu chuẩn bị đến diễn biến chính và kết thúc ý nghĩa.`,
          reminders: 'Lưu ý cân đối giữa phần tường thuật sự việc và biểu lộ cảm nghĩ, kết hợp tả cảnh để bài viết thêm phần sinh động em nhé.',
          growthWords: 'Cách em thuật lại hoạt động phối hợp đồng đội cho thấy em có óc quan sát rất tốt và tinh thần tập thể cao đẹp.'
        },
        'neu-y-kien-hien-tuong': {
          celebration: `Chúc mừng em! Điểm dàn ý của em đã tăng tận ${scoreDiff} điểm! Lập luận lần này vô cùng sắc bén và thuyết phục nhờ em đã nêu rõ quan điểm đồng tình/phản đối, có lý lẽ và dẫn chứng rõ ràng.`,
          reminders: 'Cần chú ý đa dạng hóa các ví dụ từ đời sống học đường để lý lẽ thêm phần vững chắc và dễ thuyết phục bạn đọc hơn nhé.',
          growthWords: 'Tư duy lập luận và trình bày ý kiến của em rất tốt. Em đã biết cách dùng lý lẽ và dẫn chứng thực tiễn để củng cố quan điểm cá nhân.'
        }
      };

    const currentFeedback = compFeedback[type] || compFeedback['ta-cay-coi'];

    return res.json({
      scoreBefore,
      scoreAfter,
      scoreDiff,
      skillsBefore,
      skillsAfter: {
        understand: Math.min(skillsBefore.understand + 2, 20),
        structure: Math.min(skillsBefore.structure + 3, 20),
        development: Math.min(skillsBefore.development + 5, 25),
        creativity: Math.min(skillsBefore.creativity + 4, 20),
        logic: Math.min(skillsBefore.logic + 4, 15)
      },
      feedback: currentFeedback
    });
  }

  try {
    const prompt = `Bạn là huấn luyện viên viết văn Tiếng Việt lớp 4.
Học sinh đã nhận phản hồi từ dàn ý ban đầu (Dàn ý 1), sau đó tự tay điều chỉnh cải tiến thành Dàn ý cải thiện (Dàn ý 2).
Hãy chấm điểm lại Dàn ý 2 và so sánh sự tiến bộ cụ thể giữa hai phiên bản để tôn vinh sự học hỏi và chỉ ra kỹ năng em đã làm tốt lên.

Chủ đề đề bài: "${topic}"
Dạng bài tương ứng: ${type}

Phiên bản Dàn ý 1 (Trước):
"${outlineBefore}"
Điểm của Dàn ý 1 dã chấm trước đó: ${scoreBefore}/100

Phiên bản Dàn ý 2 (Sau cải thiện):
"${outlineAfter}"

Bây giờ bạn hãy đánh giá Dàn ý 2 và lập báo cáo so sánh trước - sau.
Lưu ý: Dàn ý 2 sẽ cải thiện dựa trên các ý gợi ý nên điểm thường cao hơn Dàn ý 1, phản ánh sự tự điều chỉnh và tiếp thu phản hồi của học sinh.

Hãy gửi kết quả cấu trúc JSON duy nhất sau (không có các chữ nằm ngoài JSON):
{
  "scoreBefore": ${scoreBefore}, // Giữ nguyên điểm cũ
  "scoreAfter": 86, // Chấm điểm Dàn ý 2 (thông thường cao hơn Dàn ý 1, tối đa 100)
  "scoreDiff": 21, // Hiệu số tăng điểm thực tế (scoreAfter - scoreBefore)
  "skillsBefore": {
    "understand": ${skillsBefore.understand},
    "structure": ${skillsBefore.structure},
    "development": ${skillsBefore.development},
    "creativity": ${skillsBefore.creativity},
    "logic": ${skillsBefore.logic}
  },
  "skillsAfter": {
    "understand": 18, // Chấm điểm từng cột cho Dàn ý 2 (max 20)
    "structure": 19, // (max 20)
    "development": 22, // (max 25)
    "creativity": 18, // (max 20)
    "logic": 13 // (max 15)
  },
  "feedback": {
    "celebration": "Lời chúc mừng đầy hào hứng, nêu đích xác từ ngữ/chi tiết em đã thêm vào Dàn ý 2 tạo sự cải tiến bất ngờ.",
    "reminders": "Một lưu ý nhỏ để em chú trọng hơn cho bài văn thật sau này.",
    "growthWords": "Chân dung người viết: Nhận xét tóm gọn em đã chuyển mình thế nào (Ví dụ: Từ việc mô tả chung chung sang việc sử dụng xúc cảm và hình tượng tả chi tiết sinh động)."
  }
}`;

    const textRes = await generateWithFallback(client, model, prompt, {
      responseMimeType: 'application/json',
      temperature: 0.5,
    });
    const data = JSON.parse(cleanJsonResponse(textRes));
    return res.json(data);
  } catch (err: any) {
    console.error('Gemini compare error:', err);
    const hasApiKey = !!(clientApiKey || process.env.GEMINI_API_KEY);
    if (hasApiKey) {
      return res.status(500).json({ error: `Gemini API Error: ${err.message || err}` });
    }
    // Graceful fallback
    const mockAfter = Math.min(scoreBefore + 15, 96);
    return res.json({
      scoreBefore,
      scoreAfter: mockAfter,
      scoreDiff: mockAfter - scoreBefore,
      skillsBefore,
      skillsAfter: {
        understand: Math.min(skillsBefore.understand + 1, 20),
        structure: Math.min(skillsBefore.structure + 2, 20),
        development: Math.min(skillsBefore.development + 4, 25),
        creativity: Math.min(skillsBefore.creativity + 3, 20),
        logic: Math.min(skillsBefore.logic + 2, 15)
      },
      feedback: {
        celebration: 'Chúc mừng sự nỗ lực vượt khó tuyệt vời của em! Dàn ý lần 2 đã bổ sung những câu miêu tả sống động, nhiều từ láy và âm thanh vang vui.',
        reminders: 'Em cần liên kết hai đoạn tả hoạt động tự nhiên hơn nữa để chuyển cảnh thật mượt nhé.',
        growthWords: 'Em đã học được thói quen lắng nghe phản hồi và biến ý tưởng còn sơ sài thành bức tranh văn học giàu sắc thái.'
      }
    });
  }
});

function getGenreSpecificMockChat(messages: any[], topic: string, type: string) {
  const userMessages = (messages || []).filter((m: any) => m.role === 'user');
  const userMsgCount = userMessages.length;

  const genreReplies: Record<string, Array<{ reply: string; suggestedOutlinePart: any }>> = {
        'ta-cay-coi': [
          { 
            reply: '🦉 Tả cây cối thật thú vị! Bạn nhỏ hãy giới thiệu cụ thể hơn: đó là cây gì, trồng ở đâu và do ai trồng thế?', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Một loài cây rất quen thuộc! Bây giờ, bạn nhỏ hãy miêu tả dáng vẻ bao quát của cây (chiều cao, tán lá rộng hay hẹp) khi nhìn từ xa nhé.', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Nét tả dáng cây rất tốt! Gợi ý phần Mở bài đây em. Tiếp theo, hãy tả chi tiết các bộ phận nổi bật như thân, cành, lá, hoa hoặc quả của cây nhé.', 
            suggestedOutlinePart: { 
              section: 'mobi', 
              content: [
                `Giới thiệu cây định tả: ${topic || 'Cây bóng mát/cây hoa/cây ăn quả'}`,
                'Nêu ấn tượng bao quát và tình cảm ban đầu dành cho cây.'
              ] 
            } 
          },
          { 
            reply: '🦉 Những chi tiết miêu tả thật sinh động! Hãy kể thêm ích lợi của cây đối với con người hoặc loài vật xung quanh (chim chóc, ong bướm...) nhé.', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Ích lợi của cây thật đáng quý! Đây là gợi ý phần Thân bài dựa trên ý của em. Cuối cùng, bạn nhỏ có tình cảm thế nào và sẽ chăm sóc cây như thế nào?', 
            suggestedOutlinePart: { 
              section: 'thanbi', 
              content: [
                'Tả bao quát: Dáng cây từ xa, chiều cao, tán lá xum xuê.',
                'Tả chi tiết: Thân cây thô ráp, cành lá xanh mướt, hoa khoe sắc hoặc quả ngọt lành.',
                'Tác dụng: Ích lợi của cây với đời sống con người và các con vật xung quanh.'
              ] 
            } 
          },
          { 
            reply: '🦉 Tình cảm của em thật ấm áp! Mình gửi em gợi ý phần Kết bài để hoàn thiện bản đồ ý tưởng tả cây cối nhé.', 
            suggestedOutlinePart: { 
              section: 'ketbi', 
              content: [
                'Khẳng định tình cảm yêu quý và ích lợi của cây.',
                'Nêu ý thức chăm sóc, bảo vệ cây xanh của bản thân.'
              ] 
            } 
          }
        ],
        'ke-chuyen-da-doc-da-nghe': [
          { 
            reply: '🦉 Kể chuyện là một hành trình thú vị! Hãy giới thiệu tên câu chuyện em định kể và cho mình biết em đã đọc hay nghe câu chuyện này ở đâu thế?', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Một câu chuyện rất ý nghĩa! Hãy cho mình biết nhân vật chính của truyện là ai và truyện bắt đầu bằng sự việc gì đầu tiên?', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Mở đầu thật cuốn hút! Gợi ý phần Mở bài đây em. Tiếp theo, diễn biến chính của câu chuyện trải qua những sự việc quan trọng nào (sự việc 1, sự việc 2...)?', 
            suggestedOutlinePart: { 
              section: 'mobi', 
              content: [
                `Giới thiệu câu chuyện đã đọc, đã nghe: ${topic || 'Câu chuyện cổ tích/ngụ ngôn'}`,
                'Nêu ấn tượng chung nhất về câu chuyện.'
              ] 
            } 
          },
          { 
            reply: '🦉 Diễn biến thật hấp dẫn! Kết cục của câu chuyện diễn ra thế nào? Nhân vật chính có được kết quả xứng đáng không?', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Một cái kết thật trọn vẹn! Đây là gợi ý phần Thân bài của em. Cuối cùng, câu chuyện này gửi gắm bài học đạo đức hay ý nghĩa gì đến bạn nhỏ?', 
            suggestedOutlinePart: { 
              section: 'thanbi', 
              content: [
                'Sự việc mở đầu khơi nguồn câu chuyện.',
                'Diễn biến chính: Các sự việc xảy ra theo trình tự thời gian logic, cách giải quyết các tình huống khó khăn.',
                'Sự việc kết thúc: Nêu kết cục của các nhân vật.'
              ] 
            } 
          },
          { 
            reply: '🦉 Bài học thật sâu sắc! Mình gửi gợi ý phần Kết bài để em hoàn thiện bản đồ ý tưởng kể chuyện của mình nhé.', 
            suggestedOutlinePart: { 
              section: 'ketbi', 
              content: [
                'Khẳng định kết quả chung của câu chuyện.',
                'Rút ra bài học đạo đức hoặc thông điệp ý nghĩa bản thân tự rèn luyện.'
              ] 
            } 
          }
        ],
        'cam-xuc-nhan-vat-van-hoc': [
          { 
            reply: '🦉 Cảm xúc về nhân vật văn học giúp ta thấu hiểu tác phẩm sâu hơn! Em định viết về nhân vật nào và trong câu chuyện/bài thơ nào thế?', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Nhân vật này rất đặc sắc! Điều gì ở nhân vật này (ngoại hình, lời nói, hành động hoặc tấm lòng) làm em xúc động nhất?', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Chi tiết thật lay động! Gợi ý phần Mở đoạn đây em. Hãy kể thêm một tình huống hoặc sự việc cụ thể thể hiện rõ tính cách/phẩm chất tốt đẹp đó của nhân vật nhé.', 
            suggestedOutlinePart: { 
              section: 'mobi', 
              content: [
                `Giới thiệu nhân vật văn học và tác phẩm tương ứng: ${topic || 'Nhân vật trong truyện'}`,
                'Nêu cảm xúc, ấn tượng bao quát chung.'
              ] 
            } 
          },
          { 
            reply: '🦉 Dẫn chứng thật thuyết phục! Phẩm chất tốt đẹp của nhân vật này đã giúp em học hỏi hoặc suy nghĩ thêm điều gì trong cuộc sống?', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Suy tư rất ngoan! Đây là gợi ý phần Thân đoạn. Cuối cùng, em muốn khẳng định tình cảm lâu bền của mình dành cho nhân vật như thế nào?', 
            suggestedOutlinePart: { 
              section: 'thanbi', 
              content: [
                'Miêu tả nét nổi bật nhất ở nhân vật (ngoại hình, hành động hoặc phẩm chất).',
                'Nêu chi tiết cụ thể làm em nhớ nhất.',
                'Bộc lộ cảm xúc yêu quý, kính phục hoặc cảm thông sâu sắc.'
              ] 
            } 
          },
          { 
            reply: '🦉 Tình cảm thật trân quý! Đây là gợi ý phần Kết đoạn để hoàn thiện dàn ý cảm xúc về nhân vật của em.', 
            suggestedOutlinePart: { 
              section: 'ketbi', 
              content: [
                'Khẳng định lại tình cảm yêu mến, kính trọng đối với nhân vật.',
                'Nêu bài học rèn luyện bản thân noi theo phẩm chất tốt của nhân vật.'
              ] 
            } 
          }
        ],
        'thuat-lai-su-viec': [
          { 
            reply: '🦉 Thuật lại sự việc giúp em lưu giữ những kỷ niệm đẹp! Sự việc em muốn kể là gì thế? Em tham gia hay chứng kiến sự việc đó?', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Sự việc thật ý nghĩa! Không khí chuẩn bị trước khi sự việc bắt đầu diễn ra như thế nào, mọi người chuẩn bị ra sao?', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Không khí rộn ràng quá! Gợi ý phần Mở bài đây em. Hãy thuật lại diễn biến chính của sự việc theo thứ tự trước sau (bắt đầu bằng việc gì, việc gì tiếp theo)?', 
            suggestedOutlinePart: { 
              section: 'mobi', 
              content: [
                `Giới thiệu sự việc em tham gia hoặc chứng kiến: ${topic || 'Sự việc đáng nhớ'}`,
                'Nêu thời gian, địa điểm và cảm xúc bao quát đầu tiên.'
              ] 
            } 
          },
          { 
            reply: '🦉 Diễn biến thật nhịp nhàng! Điểm nhấn hoặc hành động nổiật nhất, đáng nhớ nhất của sự việc là gì thế em?', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Những chi tiết rất sống động! Đây là gợi ý phần Thân bài. Cuối cùng, sự việc kết thúc ra sao và hoạt động này mang lại ý nghĩa gì cho em hoặc tập thể?', 
            suggestedOutlinePart: { 
              section: 'thanbi', 
              content: [
                'Hoạt động chuẩn bị: địa điểm, dụng cụ, tâm trạng háo hức.',
                'Tiến trình chính: Các sự việc diễn ra theo trình tự thời gian rõ ràng, các hoạt động sôi nổi nhất.',
                'Tương tác con người: Nét mặt, cử chỉ, tinh thần đoàn kết vui vẻ.'
              ] 
            } 
          },
          { 
            reply: '🦉 Một hoạt động thật đáng tự hào! Gửi em gợi ý Kết bài để hoàn chỉnh bản đồ ý tưởng thuật lại sự việc nhé.', 
            suggestedOutlinePart: { 
              section: 'ketbi', 
              content: [
                'Nêu kết quả và ý nghĩa của hoạt động/sự việc.',
                'Bộc lộ cảm nghĩ cá nhân (vui sướng, tự hào) và bài học đoàn kết.'
              ] 
            } 
          }
        ],
        'neu-y-kien-hien-tuong': [
          { 
            reply: '🦉 Nêu ý kiến giúp rèn luyện tư duy lập luận! Chủ đề hiện tượng em muốn bàn luận là gì? Em đồng tình hay phản đối hiện tượng đó?', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Lập trường rất rõ ràng! Hãy đưa ra lý do thứ nhất quan trọng nhất để thuyết phục mọi người đồng ý với ý kiến của em.', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Lý lẽ rất đanh thép! Gửi em gợi ý phần Mở bài nhé. Tiếp theo, em có ví dụ hoặc dẫn chứng cụ thể nào trong cuộc sống để minh họa cho lý lẽ trên không?', 
            suggestedOutlinePart: { 
              section: 'mobi', 
              content: [
                `Nêu hiện tượng/sự việc đời sống cần bày tỏ ý kiến: ${topic || 'Hiện tượng đời sống'}`,
                'Khẳng định lập trường đồng tình hay phản đối rõ ràng.'
              ] 
            } 
          },
          { 
            reply: '🦉 Dẫn chứng thực tế rất thuyết phục! Theo em, nếu mọi người thực hiện tốt (hoặc tránh xa hiện tượng này) thì cuộc sống sẽ tốt đẹp lên như thế nào?', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Lập luận rất chặt chẽ! Đây là gợi ý phần Thân bài. Cuối cùng, em có lời khuyên hay đề xuất hành động cụ thể nào dành cho các bạn học sinh không?', 
            suggestedOutlinePart: { 
              section: 'thanbi', 
              content: [
                'Lý lẽ 1: Giải thích nguyên nhân hoặc ý nghĩa cốt lõi của quan điểm.',
                'Dẫn chứng: Đưa ra ví dụ cụ thể sinh động từ đời sống học đường/gia đình.',
                'Lý lẽ 2: Phân tích lợi ích (nếu đồng tình) hoặc tác hại (nếu phản đối) của hiện tượng.'
              ] 
            } 
          },
          { 
            reply: '🦉 Lời kêu gọi rất có sức nặng! Mình gửi em gợi ý phần Kết bài để hoàn thiện bản đồ ý kiến nhé.', 
            suggestedOutlinePart: { 
              section: 'ketbi', 
              content: [
                'Khẳng định lại ý kiến, quan điểm của bản thân về hiện tượng.',
                'Gửi thông điệp hành động kêu gọi mọi người cùng thực hiện.'
              ] 
            } 
          }
        ],
        'neu-y-kien-cau-chuyen': [
          { 
            reply: '🦉 Chia sẻ lý do yêu thích câu chuyện là điều rất bổ ích! Câu chuyện em muốn giới thiệu là câu chuyện nào thế?', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Một tác phẩm tuyệt vời! Lý do chính về nội dung câu chuyện (ý nghĩa bài học, tính cách nhân vật...) làm em thích thú là gì?', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Lý do rất thuyết phục! Gợi ý phần Mở đoạn đây em. Ngoài nội dung, em có ấn tượng với chi tiết kỳ ảo hay cách kể chuyện độc đáo nào của tác giả không?', 
            suggestedOutlinePart: { 
              section: 'mobi', 
              content: [
                `Giới thiệu câu chuyện em yêu thích: ${topic || 'Câu chuyện ý nghĩa'}`,
                'Nêu lý do khái quát nhất khiến em yêu mến tác phẩm.'
              ] 
            } 
          },
          { 
            reply: '🦉 Chi tiết nghệ thuật đó thật đắt giá! Em nhớ nhất tình huống nào trong truyện làm nổi bật vẻ đẹp của nhân vật chính?', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Dẫn chứng thật sinh động! Đây là gợi ý phần Thân đoạn. Cuối cùng, câu chuyện này đã bồi đắp thêm tình cảm hay suy nghĩ gì tốt đẹp cho em?', 
            suggestedOutlinePart: { 
              section: 'thanbi', 
              content: [
                'Lý do yêu thích nội dung: Cốt truyện ý nghĩa nhân văn, nhân vật có hành động đẹp.',
                'Lý do yêu thích nghệ thuật: Chi tiết kỳ ảo thú vị, lối kể lôi cuốn.',
                'Chi tiết đắt giá: Trích dẫn hoặc chỉ rõ tình huống làm nên sức hút.'
              ] 
            } 
          },
          { 
            reply: '🦉 Câu chuyện thật đáng đọc! Gửi em gợi ý phần Kết đoạn để hoàn chỉnh bản đồ ý tưởng nhé.', 
            suggestedOutlinePart: { 
              section: 'ketbi', 
              content: [
                'Khẳng định lại tình cảm của bản thân dành cho câu chuyện.',
                'Khuyên các bạn học sinh nên tìm đọc để cảm nhận bài học.'
              ] 
            } 
          }
        ],
        'cam-xuc-nguoi-than': [
          { 
            reply: '🦉 Viết về người thân yêu luôn đong đầy tình cảm! Người em muốn bày tỏ tình cảm là ai trong gia đình hoặc trường học của em?', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Người ấy thật ấm áp! Em hãy kể những cử chỉ chăm sóc hoặc hành động yêu thương cụ thể người ấy dành cho em hằng ngày nhé.', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Tình thương thật bao la! Gợi ý phần Mở bài đây em. Hãy kể thêm một kỷ niệm ngọt ngào hoặc đáng nhớ nhất giữa em và người ấy nhé.', 
            suggestedOutlinePart: { 
              section: 'mobi', 
              content: [
                `Giới thiệu người thân và mối quan hệ gắn bó: ${topic || 'Người thân yêu'}`,
                'Bày tỏ tình cảm, lòng biết ơn khái quát ban đầu.'
              ] 
            } 
          },
          { 
            reply: '🦉 Kỷ niệm thật xúc động! Những cử chỉ, nụ cười hay lời khuyên dạy của người ấy đã giúp em tiến bộ hoặc trưởng thành như thế nào?', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Những lời chia sẻ đầy lòng hiếu thảo! Đây là gợi ý phần Thân bài. Cuối cùng, bạn nhỏ muốn gửi gắm mong ước hay lời hứa chân thành thế nào đến người ấy?', 
            suggestedOutlinePart: { 
              section: 'thanbi', 
              content: [
                'Đặc điểm gợi nhớ: Tả cử chỉ, nụ cười ấm áp, đôi bàn tay lao động lam lũ chăm lo cho em.',
                'Hành động yêu thương: Sự chăm sóc ân cần hằng ngày (nấu ăn, dạy học, chăm sóc khi ốm).',
                'Kỷ niệm đáng nhớ: Một sự việc cụ thể ghi sâu tình cảm gắn bó giữa hai người.'
              ] 
            } 
          },
          { 
            reply: '🦉 Lòng biết ơn thật hiếu kính! Mình gửi em gợi ý phần Kết bài để hoàn chỉnh dàn ý nhé.', 
            suggestedOutlinePart: { 
              section: 'ketbi', 
              content: [
                'Khẳng định tình yêu thương vô bờ đối với người thân.',
                'Tự hứa ngoan ngoãn học tập tốt để mang lại niềm vui cho người đó.'
              ] 
            } 
          }
        ],
        'viet-thu': [
          { 
            reply: '🦉 Viết thư là cách kết nối tuyệt vời! Em định viết thư cho ai và viết nhân dịp gì thế?', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Thật ý nghĩa! Ở phần đầu thư sau lời chào, em định hỏi thăm những thông tin gì về sức khỏe hoặc tình hình của người nhận thư?', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Hỏi thăm rất ân cần! Gợi ý phần Đầu thư đây em. Tiếp theo, ở nội dung chính, em sẽ thông báo những tin vui gì về tình hình học tập lớp 4 của em hiện tại?', 
            suggestedOutlinePart: { 
              section: 'mobi', 
              content: [
                'Ghi địa điểm và ngày tháng năm viết thư.',
                `Lời xưng hô chào hỏi đầu thư thân mật với người nhận thư: ${topic || 'Người nhận thư'}.`
              ] 
            } 
          },
          { 
            reply: '🦉 Những tin vui học tập thật đáng tự hào! Em có lời hứa hay lời hẹn ước nào cùng người nhận thư ở cuối nội dung thư không?', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Lời hứa hẹn rất tình cảm! Gửi em gợi ý phần Thân thư. Cuối cùng, ở phần cuối thư, em sẽ viết lời chúc và ký tên như thế nào?', 
            suggestedOutlinePart: { 
              section: 'thanbi', 
              content: [
                'Lý do viết thư chân thành.',
                'Hỏi thăm tình hình người nhận thư: sức khỏe, công việc/học tập.',
                'Thông báo tình hình bản thân: việc học tập lớp 4, sức khỏe và các hoạt động thú vị.'
              ] 
            } 
          },
          { 
            reply: '🦉 Rất đúng quy cách! Gửi em gợi ý phần Cuối thư để hoàn thành bức thư nhé.', 
            suggestedOutlinePart: { 
              section: 'ketbi', 
              content: [
                'Lời chúc sức khỏe, niềm vui gửi người nhận thư và lời hứa hẹn.',
                'Lời chào tạm biệt, chữ ký và họ tên của người viết.'
              ] 
            } 
          }
        ],
        'viet-don': [
          { 
            reply: '🦉 Viết đơn cần sự trang trọng và chính xác! Đơn em định viết gửi cho ai (cô giáo chủ nhiệm, ban phụ trách...) và đơn xin việc gì thế?', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Mục đích viết đơn rất chính đáng! Để điền thông tin cá nhân, em cần nêu đầy đủ họ tên, ngày sinh và lớp học của mình thế nào?', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Thông tin cá nhân đã rõ ràng! Gợi ý phần Mở đầu đơn đây em. Tiếp theo, lý do cụ thể và thuyết phục nhất để em làm đơn này là gì?', 
            suggestedOutlinePart: { 
              section: 'mobi', 
              content: [
                'Quốc hiệu, Tiêu ngữ và Tên đơn viết in hoa nổi bật.',
                'Địa điểm và ngày tháng năm viết đơn.',
                `Phần Kính gửi ghi rõ nơi nhận đơn: ${topic || 'Thầy cô/Ban phụ trách'}.`
              ] 
            } 
          },
          { 
            reply: '🦉 Lý do rất rõ ràng và hợp lý! Em sẽ đưa ra lời cam kết hoặc hứa chấp hành nghiêm túc quy định như thế nào ở cuối đơn?', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Cam kết rất tự giác! Đây là gợi ý phần Nội dung đơn. Cuối cùng, trước khi ký tên, em cần ghi lời cảm ơn như thế nào?', 
            suggestedOutlinePart: { 
              section: 'thanbi', 
              content: [
                'Thông tin người làm đơn: Họ tên, ngày sinh, học sinh lớp 4.',
                'Lý do làm đơn trình bày ngắn gọn, trung thực.',
                'Lời cam kết thực hiện nghiêm túc quy định hoặc chép bài đầy đủ (nếu nghỉ học).'
              ] 
            } 
          },
          { 
            reply: '🦉 Rất chuẩn mực! Gửi em gợi ý phần Cuối đơn để hoàn thành bức đơn hành chính nhé.', 
            suggestedOutlinePart: { 
              section: 'ketbi', 
              content: [
                'Lời cảm ơn chân thành gửi người nhận đơn.',
                'Họ tên và chữ ký của người làm đơn.'
              ] 
            } 
          }
        ],
        'ta-con-vat': [
          { 
            reply: '🦉 Tả con vật thật ngộ nghĩnh đáng yêu! Con vật em chọn tả là con vật gì và nuôi ở đâu thế?', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Một người bạn nhỏ tuyệt vời! Hãy miêu tả một vài đặc điểm nổi bật nhất về ngoại hình của chú ấy (như màu lông, đôi mắt lanh lợi, cái đuôi...) nhé.', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Miêu tả ngoại hình rất ngộ nghĩnh! Gợi ý phần Mở bài đây em. Tiếp theo, thói quen sinh hoạt hoặc hoạt động nghịch ngợm đáng yêu nào của chú ấy làm em thích nhất?', 
            suggestedOutlinePart: { 
              section: 'mobi', 
              content: [
                `Giới thiệu con vật định tả: ${topic || 'Con vật đáng yêu'}`,
                'Nêu nguồn gốc hoặc hoàn cảnh em nuôi/quan sát con vật.'
              ] 
            } 
          },
          { 
            reply: '🦉 Hoạt động rất thú vị! Chú ấy mang lại ích lợi gì cho cuộc sống của gia đình em (như giữ nhà, bắt chuột, làm bầu bạn)?', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Con vật thật có ích! Đây là gợi ý phần Thân bài. Cuối cùng, tình cảm gắn bó yêu thương của em dành cho chú ấy thể hiện qua hành động chăm sóc thế nào?', 
            suggestedOutlinePart: { 
              section: 'thanbi', 
              content: [
                'Tả ngoại hình: Đặc điểm dáng vẻ vóc dáng, màu lông đặc trưng, các chi tiết mắt, tai, chân, đuôi ngộ nghĩnh.',
                'Tả hoạt động: Các động tác chạy nhảy, bắt mồi, thói quen ăn uống, đùa nghịch hằng ngày.',
                'Sự gắn bó: Ích lợi của con vật đối với đời sống và tình cảm giữa em với chú vật nuôi.'
              ] 
            } 
          },
          { 
            reply: '🦉 Tình thương muông thú thật nhân hậu! Gửi em gợi ý phần Kết bài để hoàn chỉnh dàn ý tả con vật nhé.', 
            suggestedOutlinePart: { 
              section: 'ketbi', 
              content: [
                'Khẳng định tình cảm yêu mến sâu sắc dành cho con vật.',
                'Nêu ý thức chăm sóc, bảo vệ và coi con vật như người bạn thân thiết.'
              ] 
            } 
          }
        ],
        'viet-huong-dan-bao-cao': [
          { 
            reply: '🦉 Viết hướng dẫn hoặc báo cáo giúp công việc được sắp xếp khoa học! Em muốn viết hướng dẫn gấp đồ chơi hay viết báo cáo thảo luận nhóm?', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Chủ đề rất bổ ích! Để chuẩn bị gấp đồ chơi (hoặc chuẩn bị thảo luận), chúng ta cần chuẩn bị những nguyên liệu, dụng cụ hay thành phần tham gia thế nào?', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Chuẩn bị chu đáo quá! Gợi ý phần Mở đầu đây em. Tiếp theo, đối với phần nội dung chính, hãy trình bày trình tự các bước thực hiện công việc (hoặc diễn biến phân công công việc) ra sao?', 
            suggestedOutlinePart: { 
              section: 'mobi', 
              content: [
                `Nêu tên bản hướng dẫn (các bước thực hiện) hoặc tên bản báo cáo: ${topic || 'Bản hướng dẫn/Báo cáo'}`,
                'Nêu mục đích thực hiện và thời gian/địa điểm.'
              ] 
            } 
          },
          { 
            reply: '🦉 Các bước/sự việc được phân công rất mạch lạc! Kết quả thực tế hoặc sản phẩm thu được sau khi hoàn thành là gì thế?', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Sản phẩm thật tuyệt! Đây là gợi ý phần Thân bài chi tiết. Cuối cùng, công việc hoặc buổi thảo luận này đem lại ý nghĩa hay bài học gắn kết tinh thần đồng đội thế nào cho các em?', 
            suggestedOutlinePart: { 
              section: 'thanbi', 
              content: [
                'Phần chuẩn bị: Liệt kê đầy đủ nguyên vật liệu hoặc thành phần tham dự, địa điểm.',
                'Phần tiến trình: Hướng dẫn chi tiết từng bước đánh số thứ tự logic, hoặc ghi lại phân công nhiệm vụ cụ thể cho từng thành viên trong tổ.',
                'Phần kết quả: Mô tả kết quả công việc đã hoàn thành hoặc sản phẩm tạo ra.'
              ] 
            } 
          },
          { 
            reply: '🦉 Sự gắn kết thật ý nghĩa! Gửi em gợi ý Kết thúc để hoàn thành dàn ý hướng dẫn/báo cáo của mình.', 
            suggestedOutlinePart: { 
              section: 'ketbi', 
              content: [
                'Khẳng định ý nghĩa và giá trị của công việc hoặc buổi thảo luận nhóm.',
                'Bộc lộ niềm vui, sự tự hào và ý thức tự giác rèn luyện tập thể.'
              ] 
            } 
          }
        ]
      };

  const currentReplies = genreReplies[type] || genreReplies['ta-cay-coi'];
  const replyIndex = Math.min(Math.max(userMsgCount - 1, 0), currentReplies.length - 1);
  return currentReplies[replyIndex];
}

// 4. AI Chat Scaffolding Endpoint (Cú Văn đồng hành)
app.post('/api/gemini/chat', async (req, res) => {
  const { messages, topic, type, model } = req.body;
  const clientApiKey = req.headers['x-api-key'] as string | undefined;
  
  if (!topic) {
    return res.status(400).json({ error: 'Chủ đề không được để trống' });
  }

  const client = getGeminiClient(clientApiKey);
  if (!client) {
    return res.json(getGenreSpecificMockChat(messages, topic, type));
  }

  try {
    const chatHistory = (messages || []).map((m: any) => `${m.role === 'user' ? 'Học sinh' : 'Cú Văn'}: ${m.content}`).join('\n');
    const prompt = `Bạn là Cú Văn 🦉 — một chú cú thông thái, hài hước, thân thiện. Bạn là huấn luyện viên viết văn lớp 4.
Quy tắc:
- Xưng "mình", gọi học sinh là "bạn nhỏ"
- Mỗi lượt chỉ hỏi MỘT câu hỏi gợi mở
- Dẫn dắt học sinh xây dựng dàn ý từng bước (Mở bài → Thân bài → Kết bài)
- Khuyến khích dùng từ ngữ miêu tả, cảm xúc
- Sau 2-3 câu trả lời, tổng hợp thành một phần dàn ý

Đề bài: "${topic}"
Dạng bài: ${type}

Lịch sử hội thoại:
${chatHistory}

Hãy trả lời bằng JSON:
{
  "reply": "Câu trả lời của Cú Văn (có emoji 🦉 đầu câu)",
  "suggestedOutlinePart": null hoặc { "section": "mobi|thanbi|ketbi", "content": ["ý 1", "ý 2"] }
}`;

    const textRes = await generateWithFallback(client, model, prompt, {
      responseMimeType: 'application/json',
      temperature: 0.8,
    });
    return res.json(JSON.parse(cleanJsonResponse(textRes)));
  } catch (err: any) {
    console.error('Chat error:', err);
    return res.json(getGenreSpecificMockChat(messages, topic, type));
  }
});

// 5. Sentence Transformer Endpoint (Biến hóa câu văn)
app.post('/api/gemini/transform', async (req, res) => {
  const { sentence, type, model } = req.body;
  const clientApiKey = req.headers['x-api-key'] as string | undefined;
  
  if (!sentence) {
    return res.status(400).json({ error: 'Câu văn không được để trống' });
  }

  const client = getGeminiClient(clientApiKey);
  if (!client) {
    return res.json({
      original: sentence,
      variations: [
        { style: 'Nhân hóa', text: sentence.replace(/rất/, 'như một người bạn hiền, luôn').replace(/\./, ', vươn mình đón nắng sớm mai.'), explanation: 'Biến sự vật thành con người có cảm xúc, hành động sống động.' },
        { style: 'So sánh', text: sentence.replace(/rất/, '').replace(/\./, '') + ', tựa như một bức tranh thiên nhiên tuyệt đẹp.', explanation: 'Dùng hình ảnh quen thuộc để người đọc hình dung rõ hơn.' },
        { style: 'Từ láy & Giác quan', text: sentence.replace(/rất/, 'lừng lững, xanh mướt mát,').replace(/\./, ', tỏa bóng mát rượi cho sân trường.'), explanation: 'Từ láy gợi hình ảnh, âm thanh, xúc giác sinh động hơn.' }
      ]
    });
  }

  try {
    const prompt = `Bạn là huấn luyện viên viết văn lớp 4. Học sinh viết một câu đơn giản, hãy biến hóa thành 3 phiên bản hay hơn.

Câu gốc: "${sentence}"
Dạng bài: ${type || 'ta-canh'}

Trả về JSON:
{
  "original": "${sentence}",
  "variations": [
    { "style": "Nhân hóa", "text": "Câu đã biến hóa bằng nhân hóa", "explanation": "Giải thích ngắn biện pháp tu từ" },
    { "style": "So sánh", "text": "Câu đã biến hóa bằng so sánh", "explanation": "Giải thích" },
    { "style": "Từ láy & Giác quan", "text": "Câu đã biến hóa bằng từ láy", "explanation": "Giải thích" }
  ]
}`;

    const textRes = await generateWithFallback(client, model, prompt, {
      responseMimeType: 'application/json',
      temperature: 0.85,
    });
    return res.json(JSON.parse(cleanJsonResponse(textRes)));
  } catch (err: any) {
    console.error('Transform error:', err);
    // Graceful fallback to mock variations
    return res.json({
      original: sentence,
      variations: [
        { style: 'Nhân hóa', text: sentence.replace(/rất/, 'như một người bạn hiền, luôn').replace(/\./, ', vươn mình đón nắng sớm mai.'), explanation: 'Biến sự vật thành con người có cảm xúc, hành động sống động.' },
        { style: 'So sánh', text: sentence.replace(/rất/, '').replace(/\./, '') + ', tựa như một bức tranh thiên nhiên tuyệt đẹp.', explanation: 'Dùng hình ảnh quen thuộc để người đọc hình dung rõ hơn.' },
        { style: 'Từ láy & Giác quan', text: sentence.replace(/rất/, 'lừng lững, xanh mướt mát,').replace(/\./, ', tỏa bóng mát rượi cho sân trường.'), explanation: 'Từ láy gợi hình ảnh, âm thanh, xúc giác sinh động hơn.' }
      ]
    });
  }
});

// 6. Detective Game Endpoint (Thám tử bắt lỗi)
app.post('/api/gemini/detective', async (req, res) => {
  const { topic, type, errorType, model } = req.body;
  const clientApiKey = req.headers['x-api-key'] as string | undefined;
  
  const client = getGeminiClient(clientApiKey);
  if (!client) {
    return res.json({
      passage: 'Sáng nay em đi học. Trường em rất đẹp. Cây bàng rất to. Hôm qua em ăn phở. Bạn bè rất vui. Trường em có sân rộng. Em thích đi học. Cô giáo dạy toán rất hay. Em rất thích trường em.',
      errors: [
        { location: 'Câu 4', type: 'Lạc đề', suggestion: 'Câu "Hôm qua em ăn phở" không liên quan đến tả trường học. Nên thay bằng chi tiết về cảnh trường.' },
        { location: 'Toàn bài', type: 'Thiếu cảm xúc', suggestion: 'Bài viết liệt kê như danh sách, thiếu từ ngữ miêu tả cảm xúc sinh động.' },
        { location: 'Câu 1-3', type: 'Câu ngắn đơn điệu', suggestion: 'Các câu quá ngắn và đơn giản. Cần dùng từ láy, tính từ để tả chi tiết hơn.' }
      ],
      difficulty: 'easy'
    });
  }

  try {
    const prompt = `Bạn là giáo viên Tiếng Việt lớp 4. Hãy viết một đoạn văn ngắn (5-8 câu) có LỖI CHỦ ĐÍCH để học sinh luyện tập phát hiện lỗi.

Đề bài: "${topic || 'Tả cảnh trường em'}"
Dạng bài: ${type || 'ta-canh'}
Loại lỗi cần cài: ${errorType || 'thiếu cảm xúc, lạc đề nhẹ'}

Trả về JSON:
{
  "passage": "Đoạn văn có lỗi chủ đích (5-8 câu)",
  "errors": [
    { "location": "Vị trí lỗi (VD: Câu 3)", "type": "Loại lỗi", "suggestion": "Gợi ý sửa" }
  ],
  "difficulty": "easy|medium|hard"
}`;

    const textRes = await generateWithFallback(client, model, prompt, {
      responseMimeType: 'application/json',
      temperature: 0.9,
    });
    return res.json(JSON.parse(cleanJsonResponse(textRes)));
  } catch (err: any) {
    console.error('Detective error:', err);
    // Graceful fallback to mock detective passage
    return res.json({
      passage: 'Sáng nay em đi học. Trường em rất đẹp. Cây bàng rất to. Hôm qua em ăn phở. Bạn bè rất vui. Trường em có sân rộng. Em thích đi học. Cô giáo dạy toán rất hay. Em rất thích trường em.',
      errors: [
        { location: 'Câu 4', type: 'Lạc đề', suggestion: 'Câu "Hôm qua em ăn phở" không liên quan đến tả trường học. Nên thay bằng chi tiết về cảnh trường.' },
        { location: 'Toàn bài', type: 'Thiếu cảm xúc', suggestion: 'Bài viết liệt kê như danh sách, thiếu từ ngữ miêu tả cảm xúc sinh động.' },
        { location: 'Câu 1-3', type: 'Câu ngắn đơn điệu', suggestion: 'Các câu quá ngắn và đơn giản. Cần dùng từ láy, tính từ để tả chi tiết hơn.' }
      ],
      difficulty: 'easy'
    });
  }
});

interface TelemetryRecord {
  teacherId: string;
  schoolName: string;
  className: string;
  studentCount: number;
  useCount: number;
  lastActive: string;
}

const KV_REST_API_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KV_REST_API_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;


async function getTelemetryStats(): Promise<Record<string, TelemetryRecord>> {
  if (KV_REST_API_URL && KV_REST_API_TOKEN) {
    try {
      const response = await fetch(`${KV_REST_API_URL}/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${KV_REST_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['HGETALL', 'vm5_telemetry']),
      });
      if (response.ok) {
        const data = await response.json();
        const list = data.result || [];
        const records: Record<string, TelemetryRecord> = {};
        for (let i = 0; i < list.length; i += 2) {
          const key = list[i];
          const val = list[i + 1];
          try {
            records[key] = JSON.parse(val);
          } catch {
            // Ignore corrupted JSON
          }
        }
        return records;
      } else {
        console.warn(`Vercel KV REST response not ok: ${response.statusText}`);
      }
    } catch (err) {
      console.error('Failed to get stats from Vercel KV, falling back to local file:', err);
    }
  }

  // Local file fallback
  const filePath = path.join(process.cwd(), 'data', 'admin_stats.json');
  try {
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(fileContent);
    }
  } catch (err) {
    console.error('Failed to read local stats file:', err);
  }
  return {};
}

async function saveTelemetryRecord(record: TelemetryRecord): Promise<void> {
  if (KV_REST_API_URL && KV_REST_API_TOKEN) {
    try {
      const response = await fetch(`${KV_REST_API_URL}/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${KV_REST_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['HSET', 'vm5_telemetry', record.teacherId, JSON.stringify(record)]),
      });
      if (response.ok) return;
      console.warn('Failed to save to Vercel KV, writing to local file instead.');
    } catch (err) {
      console.error('Failed to save to Vercel KV:', err);
    }
  }

  // Local file fallback
  const dirPath = path.join(process.cwd(), 'data');
  const filePath = path.join(dirPath, 'admin_stats.json');
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    const records = await getTelemetryStats(); // fallback check
    records[record.teacherId] = record;
    fs.writeFileSync(filePath, JSON.stringify(records, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write local stats file:', err);
  }
}

// 7. Track teacher usage endpoint
app.post('/api/admin/track-use', async (req, res) => {
  const { teacherId, schoolName, className, studentCount } = req.body;
  if (!teacherId) {
    return res.status(400).json({ error: 'Mã định danh Giáo viên (teacherId) không được trống' });
  }

  try {
    const records = await getTelemetryStats();
    const existing = records[teacherId] || {
      teacherId,
      schoolName: '',
      className: '',
      studentCount: 0,
      useCount: 0,
      lastActive: ''
    };

    const updated: TelemetryRecord = {
      teacherId,
      schoolName: schoolName || existing.schoolName || 'Chưa cập nhật',
      className: className || existing.className || 'Chưa cập nhật',
      studentCount: typeof studentCount === 'number' ? studentCount : (existing.studentCount || 0),
      useCount: (existing.useCount || 0) + 1,
      lastActive: new Date().toISOString()
    };

    await saveTelemetryRecord(updated);
    return res.json({ success: true, record: updated });
  } catch (err: any) {
    console.error('Error in /api/admin/track-use:', err);
    return res.status(500).json({ error: err.message || 'Lỗi server' });
  }
});

// 8. Get telemetry stats for admin
app.get('/api/admin/stats', async (req, res) => {
  const adminKey = req.headers['x-admin-key'] as string | undefined;
  if (adminKey !== 'admin9999') {
    return res.status(401).json({ error: 'Mã xác thực Admin không hợp lệ' });
  }

  try {
    const records = await getTelemetryStats();
    const list = Object.values(records);
    return res.json({
      success: true,
      stats: list
    });
  } catch (err: any) {
    console.error('Error in /api/admin/stats:', err);
    return res.status(500).json({ error: err.message || 'Lỗi server' });
  }
});

// ===== CENTRALIZED DATABASE HELPERS =====
async function getClassInfo(teacherId: string): Promise<any | null> {
  if (KV_REST_API_URL && KV_REST_API_TOKEN) {
    try {
      const response = await fetch(`${KV_REST_API_URL}/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${KV_REST_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['HGET', 'vm5_classes', teacherId]),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.result) {
          return JSON.parse(data.result);
        }
      }
    } catch (err) {
      console.error('Failed to get class info from Vercel KV, falling back to local file:', err);
    }
  }

  // Local file fallback
  const filePath = path.join(process.cwd(), 'data', 'classes.json');
  try {
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const db = JSON.parse(fileContent);
      if (db[teacherId]) {
        return db[teacherId];
      }
    }
  } catch (err) {
    console.error('Failed to read local classes file:', err);
  }

  // Demo class fallback for default code t_abc123
  if (teacherId === 't_abc123') {
    return {
      className: "Lớp 4A",
      schoolName: "Trường Tiểu Học VietMaster",
      students: [
        { id: "s_1", name: "Nguyễn Văn Nam", avatar: "👦", pin: "1234" },
        { id: "s_2", name: "Trần Thị Hương", avatar: "👧", pin: "1234" },
        { id: "s_3", name: "Lê Hoàng Long", avatar: "🧑", pin: "1234" },
        { id: "s_4", name: "Phạm Mai Chi", avatar: "👧", pin: "1234" }
      ],
      groups: [],
      assignments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  return null;
}

async function saveClassInfo(teacherId: string, classInfo: any): Promise<void> {
  if (KV_REST_API_URL && KV_REST_API_TOKEN) {
    try {
      const response = await fetch(`${KV_REST_API_URL}/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${KV_REST_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['HSET', 'vm5_classes', teacherId, JSON.stringify(classInfo)]),
      });
      if (response.ok) return;
      console.warn('Failed to save class to Vercel KV, writing to local file instead.');
    } catch (err) {
      console.error('Failed to save class to Vercel KV:', err);
    }
  }

  // Local file fallback
  const dirPath = path.join(process.cwd(), 'data');
  const filePath = path.join(dirPath, 'classes.json');
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    let db: Record<string, any> = {};
    if (fs.existsSync(filePath)) {
      db = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
    db[teacherId] = classInfo;
    fs.writeFileSync(filePath, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write local classes file:', err);
  }
}

async function getAllSubmissions(teacherId: string): Promise<Record<string, any[]>> {
  if (KV_REST_API_URL && KV_REST_API_TOKEN) {
    try {
      const response = await fetch(`${KV_REST_API_URL}/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${KV_REST_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['HGET', 'vm5_submissions', teacherId]),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.result) {
          return JSON.parse(data.result);
        }
      }
    } catch (err) {
      console.error('Failed to get submissions from Vercel KV, falling back to local file:', err);
    }
  }

  // Local file fallback
  const filePath = path.join(process.cwd(), 'data', 'submissions.json');
  try {
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const db = JSON.parse(fileContent);
      return db[teacherId] || {};
    }
  } catch (err) {
    console.error('Failed to read local submissions file:', err);
  }
  return {};
}

async function saveStudentSubmissions(teacherId: string, studentId: string, studentSubmissions: any[]): Promise<void> {
  const db = await getAllSubmissions(teacherId);
  db[studentId] = studentSubmissions;

  if (KV_REST_API_URL && KV_REST_API_TOKEN) {
    try {
      const response = await fetch(`${KV_REST_API_URL}/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${KV_REST_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['HSET', 'vm5_submissions', teacherId, JSON.stringify(db)]),
      });
      if (response.ok) return;
      console.warn('Failed to save submissions to Vercel KV, writing to local file instead.');
    } catch (err) {
      console.error('Failed to save submissions to Vercel KV:', err);
    }
  }

  // Local file fallback
  const dirPath = path.join(process.cwd(), 'data');
  const filePath = path.join(dirPath, 'submissions.json');
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    let fullDb: Record<string, any> = {};
    if (fs.existsSync(filePath)) {
      fullDb = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
    fullDb[teacherId] = db;
    fs.writeFileSync(filePath, JSON.stringify(fullDb, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write local submissions file:', err);
  }
}

// ===== CENTRALIZED DATABASE SYNC ENDPOINTS =====

// 1. Get Class Info
app.get('/api/sync/class-info', async (req, res) => {
  const teacherId = req.query.teacherId as string;
  if (!teacherId) {
    return res.status(450).json({ error: 'Mã giáo viên (teacherId) là bắt buộc' });
  }
  try {
    const classInfo = await getClassInfo(teacherId);
    return res.json({ success: true, classInfo });
  } catch (err: any) {
    console.error('Error in GET /api/sync/class-info:', err);
    return res.status(500).json({ error: err.message || 'Lỗi server' });
  }
});

// 2. Save Class Info
app.post('/api/sync/class-info', async (req, res) => {
  const { teacherId, classInfo } = req.body;
  if (!teacherId || !classInfo) {
    return res.status(450).json({ error: 'Mã giáo viên và thông tin lớp học là bắt buộc' });
  }
  try {
    await saveClassInfo(teacherId, classInfo);
    return res.json({ success: true });
  } catch (err: any) {
    console.error('Error in POST /api/sync/class-info:', err);
    return res.status(500).json({ error: err.message || 'Lỗi server' });
  }
});

// 3. Get Student Submissions
app.get('/api/sync/submissions', async (req, res) => {
  const teacherId = req.query.teacherId as string;
  const studentId = req.query.studentId as string;
  if (!teacherId) {
    return res.status(450).json({ error: 'Mã giáo viên (teacherId) là bắt buộc' });
  }
  try {
    const allSubs = await getAllSubmissions(teacherId);
    if (studentId) {
      return res.json({ success: true, submissions: allSubs[studentId] || [] });
    }
    return res.json({ success: true, submissions: allSubs });
  } catch (err: any) {
    console.error('Error in GET /api/sync/submissions:', err);
    return res.status(500).json({ error: err.message || 'Lỗi server' });
  }
});

// 4. Save Student Submissions
app.post('/api/sync/submissions', async (req, res) => {
  const { teacherId, studentId, submissions } = req.body;
  if (!teacherId || !studentId || !submissions) {
    return res.status(450).json({ error: 'Mã giáo viên, mã học sinh và danh sách bài viết là bắt buộc' });
  }
  try {
    await saveStudentSubmissions(teacherId, studentId, submissions);
    return res.json({ success: true });
  } catch (err: any) {
    console.error('Error in POST /api/sync/submissions:', err);
    return res.status(500).json({ error: err.message || 'Lỗi server' });
  }
});

// Configure Vite middleware in development or express static server in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`VietMaster 4 Server is running!`);
    console.log(`Local Access: http://localhost:${PORT}`);
    console.log(`To connect from your phone/tablet on the same Wi-Fi, use:`);
    
    const networkInterfaces = os.networkInterfaces();
    Object.keys(networkInterfaces).forEach((interfaceName) => {
      const interfaces = networkInterfaces[interfaceName];
      if (interfaces) {
        interfaces.forEach((iface) => {
          if (iface.family === 'IPv4' && !iface.internal) {
            console.log(`  👉 http://${iface.address}:${PORT}`);
          }
        });
      }
    });
    console.log(`======================================================\n`);
  });
}

if (process.env.NODE_ENV !== 'production') {
  startServer();
}

export default app;
