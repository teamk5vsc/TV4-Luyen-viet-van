import React, { useState, useEffect } from 'react';
import { EssayType, GradeResult, GrowthComparison, OutlineSubmission, StudentEntry, SampleEssayResult } from '../types';
import { SYLLABUS_DATA } from '../data/syllabus';
import { 
  Sparkles, Pencil, ArrowRight, CheckCircle2, ChevronRight, Play, RefreshCw, 
  Trash2, Award, ClipboardCheck, ArrowUpRight, Check, Save, Star,
  BookOpen, FileText, Copy, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AIChatScaffold from './AIChatScaffold';
import SentenceTransformer from './SentenceTransformer';
import { callGeminiApiDirectly } from '../utils/geminiDirect';

function getClientMockEssay(topic: string, type: string, format: 'essay' | 'paragraph'): SampleEssayResult {
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
  return genreEntry[format] || genreEntry['essay'];
}


function getClientMockOutline(topic: string, type: string) {
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
 
interface AIOutlineHelperProps {
  initialGenreId: string;
  initialTopic: string;
  onOutlineSaved: (submission: OutlineSubmission) => void;
  apiKey?: string;
  selectedModel?: string;
  currentStudent?: StudentEntry | null;
}
 
export default function AIOutlineHelper({ 
  initialGenreId, 
  initialTopic,
  onOutlineSaved,
  apiKey,
  selectedModel,
  currentStudent
}: AIOutlineHelperProps) {
  // Navigation
  const [activeSubTab, setActiveSubTab] = useState<'create' | 'track' | 'chat' | 'sample'>('create');
  
  // Core state inputs
  const [selectedGenreId, setSelectedGenreId] = useState<EssayType>((initialGenreId as EssayType) || 'ta-cay-coi');
  const [customTopic, setCustomTopic] = useState(initialTopic || '');
  
  // Tab 1: AI Suggested Outline States
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<{
    genre: string;
    requirements: string[];
    outline: { mobi: string[]; thanbi: string[]; ketbi: string[] };
    keywords: string[];
    errorsToAvoid: string[];
  } | null>(null);

  // Tab 2: Growth Tracker States
  const [v1Outline, setV1Outline] = useState('');
  const [isGradingV1, setIsGradingV1] = useState(false);
  const [v1Grade, setV1Grade] = useState<GradeResult | null>(null);
  
  const [v2Outline, setV2Outline] = useState('');
  const [isGradingV2, setIsGradingV2] = useState(false);
  const [comparison, setComparison] = useState<GrowthComparison | null>(null);
  
  // Reflection response state
  const [q1Changes, setQ1Changes] = useState('');
  const [q2Reasons, setQ2Reasons] = useState('');
  const [q3Learnings, setQ3Learnings] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  // Tab 4: Exemplary Essay/Paragraph States
  const [essayFormat, setEssayFormat] = useState<'essay' | 'paragraph'>('essay');
  const [useDraftOutline, setUseDraftOutline] = useState<boolean>(false);
  const [isGeneratingEssay, setIsGeneratingEssay] = useState<boolean>(false);
  const [generatedEssay, setGeneratedEssay] = useState<SampleEssayResult | null>(null);
  const [activeHighlights, setActiveHighlights] = useState<string[]>(['imagery', 'emotion', 'rhetorical', 'vocabulary']);
  const [hoveredHighlight, setHoveredHighlight] = useState<SampleHighlight | null>(null);
  const [isEssaySaved, setIsEssaySaved] = useState<boolean>(false);

  // Sync initial genre and topics from parent selection
  useEffect(() => {
    if (initialGenreId) {
      setSelectedGenreId(initialGenreId as EssayType);
    }
    if (initialTopic) {
      setCustomTopic(initialTopic);
    }
  }, [initialGenreId, initialTopic]);

  const activeGenre = SYLLABUS_DATA.find(g => g.id === selectedGenreId) || SYLLABUS_DATA[0];

  // Call /api/gemini/generate to create an outline blueprint
  const handleGenerateAI = async () => {
    let topicToUse = customTopic.trim();
    if (!topicToUse) {
      const randomTopic = activeGenre.topics[Math.floor(Math.random() * activeGenre.topics.length)];
      setCustomTopic(randomTopic);
      topicToUse = randomTopic;
    }
    
    setIsGenerating(true);
    try {
      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(apiKey ? { 'x-api-key': apiKey } : {}) },
        body: JSON.stringify({ topic: topicToUse, type: selectedGenreId, model: selectedModel })
      });
      const data = await res.json();
      if (!data || data.error || !data.outline) {
        throw new Error(data?.error || 'Invalid API response');
      }
      setGeneratedResult(data);
    } catch (err) {
      console.warn('Gemini generate outline failed, trying direct client fallback:', err);
      if (apiKey) {
        try {
          const directData = await callGeminiApiDirectly({
            action: 'generate',
            topic: topicToUse,
            type: selectedGenreId,
            model: selectedModel,
            apiKey
          });
          setGeneratedResult(directData);
          setIsGenerating(false);
          return;
        } catch (directErr) {
          console.error('Direct client-side Gemini generate failed:', directErr);
        }
      }
      setGeneratedResult(getClientMockOutline(topicToUse, selectedGenreId));
    } finally {
      setIsGenerating(false);
    }
  };

  // Call /api/gemini/grade to evaluate Version 1
  const handleGradeV1 = async () => {
    if (!customTopic.trim() || !v1Outline.trim()) return;
    setIsGradingV1(true);
    try {
      const res = await fetch('/api/gemini/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(apiKey ? { 'x-api-key': apiKey } : {}) },
        body: JSON.stringify({ topic: customTopic, type: selectedGenreId, outline: v1Outline, model: selectedModel })
      });
      const data = await res.json();
      if (!data || data.error || data.score === undefined) {
        throw new Error(data?.error || 'Invalid grading response');
      }
      setV1Grade(data);
      // Pre-populate v2 with v1 draft for easy editing
      setV2Outline(v1Outline);
    } catch (err) {
      console.warn('Gemini grading failed, trying direct client-side call:', err);
      if (apiKey) {
        try {
          const directData = await callGeminiApiDirectly({
            action: 'grade',
            topic: customTopic,
            type: selectedGenreId,
            outline: v1Outline,
            model: selectedModel,
            apiKey
          });
          setV1Grade(directData);
          setV2Outline(v1Outline);
          setIsGradingV1(false);
          return;
        } catch (directErr) {
          console.error('Direct client-side Gemini grading failed:', directErr);
        }
      }
      const scoreVal = v1Outline.length > 120 ? 84 : 68;
      setV1Grade({
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
          nextSteps: 'Hãy thử viết thêm 2-3 ý cụ thể làm rõ chi tiết gợi ý và nộp lại ở phiên bản sửa đổi (Lần 2) để thấy sự tiến bộ nhé!'
        },
        checklist: [
          { name: 'Xác định rõ ràng bối cảnh', status: true },
          { name: 'Phát triển ý chi tiết', status: v1Outline.length > 120 },
          { name: 'Sử dụng từ ngữ biểu cảm', status: v1Outline.length > 80 },
          { name: 'Có bài học trải nghiệm sâu sắc', status: v1Outline.includes('bài học') || v1Outline.length > 100 }
        ]
      });
      setV2Outline(v1Outline);
    } finally {
      setIsGradingV1(false);
    }
  };

  // Call /api/gemini/compare to evaluate Version 2 against Version 1
  const handleGradeV2 = async () => {
    if (!customTopic.trim() || !v2Outline.trim() || !v1Outline.trim()) return;
    setIsGradingV2(true);
    try {
      const res = await fetch('/api/gemini/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(apiKey ? { 'x-api-key': apiKey } : {}) },
        body: JSON.stringify({
          topic: customTopic,
          type: selectedGenreId,
          outlineBefore: v1Outline,
          outlineAfter: v2Outline,
          gradeBefore: v1Grade,
          model: selectedModel
        })
      });
      const data = await res.json();
      if (!data || data.error || data.scoreAfter === undefined) {
        throw new Error(data?.error || 'Invalid comparison response');
      }
      setComparison(data);
    } catch (err) {
      console.warn('Gemini comparison failed, trying direct client fallback:', err);
      if (apiKey) {
        try {
          const directData = await callGeminiApiDirectly({
            action: 'compare',
            topic: customTopic,
            type: selectedGenreId,
            outlineBefore: v1Outline,
            outlineAfter: v2Outline,
            scoreBefore: v1Grade?.score || 68,
            skillsBefore: v1Grade?.criteriaScores || { understand: 14, structure: 14, development: 16, creativity: 12, logic: 9 },
            model: selectedModel,
            apiKey
          });
          setComparison(directData);
          setIsGradingV2(false);
          return;
        } catch (directErr) {
          console.error('Direct client-side Gemini comparison failed:', directErr);
        }
      }

      const scoreBefore = v1Grade?.score || 68;
      const scoreAfter = Math.min(scoreBefore + 15, 96);
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

      const currentFeedback = compFeedback[selectedGenreId] || compFeedback['ta-cay-coi'];

      setComparison({
        scoreBefore,
        scoreAfter,
        scoreDiff,
        skillsBefore: v1Grade?.criteriaScores || { understand: 14, structure: 14, development: 16, creativity: 12, logic: 9 },
        skillsAfter: {
          understand: Math.min((v1Grade?.criteriaScores.understand || 14) + 1, 20),
          structure: Math.min((v1Grade?.criteriaScores.structure || 14) + 2, 20),
          development: Math.min((v1Grade?.criteriaScores.development || 16) + 4, 25),
          creativity: Math.min((v1Grade?.criteriaScores.creativity || 12) + 3, 20),
          logic: Math.min((v1Grade?.criteriaScores.logic || 9) + 2, 15)
        },
        feedback: currentFeedback
      });
    } finally {
      setIsGradingV2(false);
    }
  };

  // Persists progress report back to profile history
  const handleSaveToPortfolio = () => {
    if (!customTopic.trim()) return;
    
    const submission: OutlineSubmission = {
      id: `outline_${Date.now()}`,
      studentId: currentStudent?.id || 'guest',
      studentName: currentStudent?.name || 'Khách',
      topic: customTopic,
      type: selectedGenreId,
      outlineBefore: v1Outline,
      gradeBefore: v1Grade || undefined,
      outlineAfter: v2Outline || undefined,
      gradeAfter: comparison ? {
        score: comparison.scoreAfter,
        criteriaScores: comparison.skillsAfter,
        feedback: {
          general: comparison.feedback.growthWords,
          strengths: v1Grade?.feedback.strengths || [],
          improvements: [comparison.feedback.reminders],
          nextSteps: 'Hãy thử luyện thêm cách tạo hình ảnh biểu cảm này cho các sự việc ngoài đời khác em nhé.'
        },
        checklist: v1Grade?.checklist.map(cl => ({...cl, status: true})) || []
      } : undefined,
      comparison: comparison || undefined,
      reflection: q1Changes.trim() ? {
        q1_changes: q1Changes,
        q2_reasons: q2Reasons,
        q3_learnings: q3Learnings
      } : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onOutlineSaved(submission);
    setIsSaved(true);
  };

  const handleReset = () => {
    setV1Outline('');
    setV1Grade(null);
    setV2Outline('');
    setComparison(null);
    setQ1Changes('');
    setQ2Reasons('');
    setQ3Learnings('');
    setIsSaved(false);
    setGeneratedEssay(null);
    setIsEssaySaved(false);
  };

  const handleGenerateEssay = async () => {
    let topicToUse = customTopic.trim();
    if (!topicToUse) {
      const randomTopic = activeGenre.topics[Math.floor(Math.random() * activeGenre.topics.length)];
      setCustomTopic(randomTopic);
      topicToUse = randomTopic;
    }

    setIsGeneratingEssay(true);
    setIsEssaySaved(false);
    try {
      const res = await fetch('/api/gemini/essay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(apiKey ? { 'x-api-key': apiKey } : {}) },
        body: JSON.stringify({
          topic: topicToUse,
          type: selectedGenreId,
          format: essayFormat,
          outline: useDraftOutline ? (v2Outline || v1Outline) : undefined,
          model: selectedModel
        })
      });
      const data = await res.json();
      if (!data || data.error || !data.content) {
        throw new Error(data?.error || 'Invalid exemplary essay response');
      }
      setGeneratedEssay(data);
    } catch (err) {
      console.warn('Gemini exemplary essay generation failed, trying direct client-side call:', err);
      if (apiKey) {
        try {
          const directData = await callGeminiApiDirectly({
            action: 'essay',
            topic: topicToUse,
            type: selectedGenreId,
            format: essayFormat,
            outline: useDraftOutline ? (v2Outline || v1Outline) : undefined,
            model: selectedModel,
            apiKey
          });
          setGeneratedEssay(directData);
          setIsGeneratingEssay(false);
          return;
        } catch (directErr) {
          console.error('Direct client-side Gemini essay failed:', directErr);
        }
      }
      setGeneratedEssay(getClientMockEssay(topicToUse, selectedGenreId, essayFormat));
    } finally {
      setIsGeneratingEssay(false);
    }
  };

  const handleSaveEssayToPortfolio = () => {
    if (!customTopic.trim() || !generatedEssay) return;

    const submission: OutlineSubmission = {
      id: `outline_${Date.now()}`,
      studentId: currentStudent?.id || 'guest',
      studentName: currentStudent?.name || 'Khách',
      topic: customTopic,
      type: selectedGenreId,
      outlineBefore: v2Outline || v1Outline || 'Xem bài văn mẫu đi kèm',
      sampleEssay: generatedEssay,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onOutlineSaved(submission);
    setIsEssaySaved(true);
  };

  const renderEssayWithHighlights = (content: string, highlights: SampleHighlight[]) => {
    if (!content) return null;
    if (!highlights || highlights.length === 0) {
      return content.split('\n\n').map((para, i) => <p key={i} className="mb-4 leading-relaxed text-sm font-sans text-neutral-700">{para}</p>);
    }

    const sortedHighlights = [...highlights].sort((a, b) => b.text.length - a.text.length);
    const paragraphs = content.split('\n\n');

    return paragraphs.map((para, paraIdx) => {
      let renderedParts: React.ReactNode[] = [para];

      sortedHighlights.forEach((highlight) => {
        if (!activeHighlights.includes(highlight.type)) return;

        const newParts: React.ReactNode[] = [];
        renderedParts.forEach((part) => {
          if (typeof part !== 'string') {
            newParts.push(part);
            return;
          }

          const index = part.indexOf(highlight.text);
          if (index === -1) {
            newParts.push(part);
            return;
          }

          let tempPart = part;
          while (true) {
            const idx = tempPart.indexOf(highlight.text);
            if (idx === -1) {
              newParts.push(tempPart);
              break;
            }

            if (idx > 0) {
              newParts.push(tempPart.substring(0, idx));
            }

            let highlightClass = '';
            let emoji = '';
            if (highlight.type === 'imagery') {
              highlightClass = 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border-b-2 border-emerald-400';
              emoji = '🌿';
            } else if (highlight.type === 'emotion') {
              highlightClass = 'bg-pink-100 hover:bg-pink-200 text-pink-900 border-b-2 border-pink-400';
              emoji = '💗';
            } else if (highlight.type === 'rhetorical') {
              highlightClass = 'bg-purple-100 hover:bg-purple-200 text-purple-900 border-b-2 border-purple-400';
              emoji = '✨';
            } else {
              highlightClass = 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-b-2 border-amber-400';
              emoji = '📚';
            }

            newParts.push(
              <span
                key={`${highlight.text}-${idx}`}
                onMouseEnter={() => setHoveredHighlight(highlight)}
                onMouseLeave={() => setHoveredHighlight(null)}
                onClick={() => setHoveredHighlight(highlight)}
                className={`px-1 py-0.5 rounded-sm cursor-help transition-all duration-200 font-semibold ${highlightClass}`}
              >
                {highlight.text}
                <span className="ml-1 text-[10px] opacity-75">{emoji}</span>
              </span>
            );

            tempPart = tempPart.substring(idx + highlight.text.length);
          }
        });
        renderedParts = newParts;
      });

      return (
        <p key={paraIdx} className="mb-4 leading-relaxed text-sm font-sans whitespace-pre-line text-neutral-700">
          {renderedParts}
        </p>
      );
    });
  };

  return (
    <div className="space-y-6">
      {/* Configuration Header Row */}
      <div className="p-6 bg-white/90 backdrop-blur-sm rounded-2xl border border-amber-100/50 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:flex items-center gap-4 flex-1">
          {/* Genre select */}
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Lựa chọn dạng bài</label>
            <select
              id="genre-picker"
              value={selectedGenreId}
              onChange={(e) => {
                setSelectedGenreId(e.target.value as EssayType);
                setCustomTopic('');
                handleReset();
                setGeneratedResult(null);
              }}
              className="py-2.5 pl-3 pr-8 text-xs font-semibold text-neutral-700 bg-neutral-50 hover:bg-neutral-100 rounded-xl border border-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-300 outline-none transition cursor-pointer"
            >
              {SYLLABUS_DATA.map((genre) => (
                <option key={genre.id} value={genre.id}>
                  {genre.emoji} {genre.title}
                </option>
              ))}
            </select>
          </div>

          {/* Custom topic typing */}
          <div className="flex flex-col space-y-1 flex-1">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Chủ đề bài viết của em</label>
            <div className="relative">
              <input
                id="topic-input"
                type="text"
                placeholder="Ví dụ: Tả cảnh sân trường buổi sáng mùa thu, kể câu chuyện gia đình..."
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                className="w-full py-2.5 pl-3 pr-24 text-xs font-medium text-neutral-800 placeholder-neutral-400 bg-neutral-50 rounded-xl border border-neutral-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 transition"
              />
              <button
                id="quick-topic-btn"
                onClick={() => {
                  const randomTopic = activeGenre.topics[Math.floor(Math.random() * activeGenre.topics.length)];
                  setCustomTopic(randomTopic);
                }}
                className="absolute right-1.5 top-1.5 py-1 px-2.5 bg-neutral-200/70 hover:bg-neutral-300/80 text-neutral-700 rounded-lg text-[10px] font-bold tracking-wider uppercase transition cursor-pointer"
              >
                Đổi Đề mẫu 🎲
              </button>
            </div>
          </div>
        </div>

        {/* Outer navigation tab switchers */}
        <div className="flex flex-wrap bg-neutral-100/80 p-1 rounded-xl self-center border border-neutral-200/50 gap-1">
          <button
            id="tab-creator"
            onClick={() => setActiveSubTab('create')}
            className={`px-3 py-2 text-[11px] font-bold rounded-lg transition cursor-pointer ${
              activeSubTab === 'create'
                ? 'bg-white text-neutral-800 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            AI Gợi Ý Dàn Ý
          </button>
          <button
            id="tab-tracker"
            onClick={() => setActiveSubTab('track')}
            className={`px-3 py-2 text-[11px] font-bold rounded-lg transition cursor-pointer flex items-center space-x-1 ${
              activeSubTab === 'track'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sửa & Đo Tiến Bộ</span>
          </button>
          <button
            onClick={() => setActiveSubTab('chat')}
            className={`px-3 py-2 text-[11px] font-bold rounded-lg transition cursor-pointer flex items-center space-x-1 ${
              activeSubTab === 'chat'
                ? 'bg-gradient-to-r from-purple-500 to-violet-500 text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            <span>💬 Cú Văn đồng hành</span>
          </button>
          <button
            onClick={() => setActiveSubTab('sample')}
            className={`px-3 py-2 text-[11px] font-bold rounded-lg transition cursor-pointer flex items-center space-x-1 ${
              activeSubTab === 'sample'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>🦉 Bài văn tham khảo</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: AI Suggested Outline Builder */}
      {activeSubTab === 'create' && (
        <div className="space-y-6">
          <div className="p-6 bg-white/90 backdrop-blur-sm rounded-2xl border border-amber-100/50 shadow-sm space-y-4">
            <div className="max-w-2xl">
              <h3 className="text-base font-bold text-neutral-800 flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>Trợ lý xây dựng bản đồ ý tưởng</span>
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                Gõ đề tài của em ở ô trên và click nút dưới, AI sẽ nhận diện đặc tính, phân tích yêu cầu cốt lõi và kiến tạo một bản đồ ý tưởng khung sườn, từ khóa gợi ý cùng lưu ý tránh lỗi cụ thể.
              </p>
            </div>

            <button
              id="analyze-btn"
              disabled={isGenerating}
              onClick={handleGenerateAI}
              className={`px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl text-xs transition shadow-md hover:shadow-lg flex items-center space-x-2 cursor-pointer ${
                isGenerating ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>AI Đang nghiên cứu phân tích đề...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>AI Phân Tích Đề & Tạo Dàn Ý Gợi Ý 🚀</span>
                </>
              )}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {generatedResult && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
              >
                {/* Visual outline blocks (Left & Center, spanning 2 columns) */}
                <div className="lg:col-span-2 bg-white/90 backdrop-blur-sm rounded-2xl border border-amber-100/30 shadow-sm p-6 space-y-6">
                  <div className="border-b border-neutral-100 pb-3">
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full uppercase">Bản đồ gợi ý ý tưởng</span>
                    <h4 className="text-lg font-bold text-neutral-800 mt-1.5 font-sans break-words">💡 Đề tài: {customTopic}</h4>
                  </div>

                  <div className="space-y-6">
                    {/* Mở bài */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Mở bài</span>
                      </div>
                      <div className="bg-amber-50/20 p-4 rounded-xl border border-amber-100/40 space-y-1.5 text-xs text-neutral-700">
                        {generatedResult.outline.mobi.map((item, idx) => (
                          <div key={idx} className="flex items-start">
                            <span className="text-amber-500 mr-2 font-mono">▸</span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Thân bài */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Thân bài</span>
                      </div>
                      <div className="bg-emerald-50/10 p-4 rounded-xl border border-emerald-100/30 space-y-2 text-xs text-neutral-700">
                        {generatedResult.outline.thanbi.map((item, idx) => (
                          <div key={idx} className="flex items-start">
                            <span className="text-emerald-500 mr-2 font-mono">▸</span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Kết bài */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Kết bài</span>
                      </div>
                      <div className="bg-purple-50/10 p-4 rounded-xl border border-purple-100/30 space-y-1.5 text-xs text-neutral-700">
                        {generatedResult.outline.ketbi.map((item, idx) => (
                          <div key={idx} className="flex items-start">
                            <span className="text-purple-500 mr-2 font-mono">▸</span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Requirements & errors summary (Right columns) */}
                <div className="space-y-6">
                  {/* Requirements box */}
                  <div className="bg-white/90 backdrop-blur-sm p-5 rounded-2xl border border-amber-100/30 shadow-sm space-y-3">
                    <h4 className="font-bold text-xs text-neutral-800 uppercase tracking-widest border-b border-neutral-100 pb-2">🎯 Yêu cầu trọng tâm đề bài</h4>
                    <ul className="space-y-2.5 text-xs text-neutral-600">
                      {generatedResult.requirements.map((req, idx) => (
                        <li key={idx} className="flex items-start text-neutral-700 leading-snug">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-2 shrink-0 mt-0.5" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Vocabulary recommendations */}
                  <div className="bg-white/90 backdrop-blur-sm p-5 rounded-2xl border border-amber-100/30 shadow-sm space-y-3">
                    <h4 className="font-bold text-xs text-rose-800 uppercase tracking-widest border-b border-rose-50 pb-2">🌿 Từ khóa & Từ láy gợi ý</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {generatedResult.keywords.map((word) => (
                        <span key={word} className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-100 rounded-lg text-xs font-medium">
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Common mistakes */}
                  <div className="bg-rose-50 p-5 rounded-2xl border border-rose-100 space-y-3">
                    <h4 className="font-bold text-xs text-rose-800 uppercase tracking-widest border-b border-rose-100 pb-2">⚡ Điểm học sinh cần tránh</h4>
                    <div className="space-y-2 text-[11px] text-rose-900 leading-relaxed">
                      {generatedResult.errorsToAvoid.map((err, idx) => (
                        <div key={idx} className="flex items-start">
                          <span className="text-rose-500 font-bold mr-1.5">⚠</span>
                          <span>{err}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* SUB-TAB 2: Writing Growth Tracker (Interactive 1st Draft vs 2nd Draft) */}
      {activeSubTab === 'track' && (
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {!v1Grade ? (
              /* PANEL A: Submission of Edition 1 (Draft Lần 1) */
              <motion.div
                key="v1-submit"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-white/90 backdrop-blur-sm rounded-2xl border border-amber-100/50 shadow-sm p-6 space-y-5"
              >
                <div>
                  <h3 className="text-base font-bold text-neutral-800">Bước 1: Viết dàn ý dự thảo Lần 1</h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    Chuẩn bị dàn ý phác thảo cơ bản cho đề tài <strong className="text-amber-800">"{customTopic || 'Chưa đặt đề bài'}"</strong>. Không cần quá hoàn hảo, AI sẽ giúp em tìm điểm khuyết để nâng cấp!
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs text-neutral-400">
                    <span>Soạn thảo dàn ý sơ khai của em ở đây</span>
                    <span>tối thiểu nên ghi 3-4 dòng</span>
                  </div>
                  <textarea
                    id="v1-textarea"
                    rows={8}
                    placeholder="Ví dụ:&#13;Mở bài: Giới thiệu trường học vào buổi sáng ra chơi.&#13;Thân bài: Sân trường rất vui vẻ. Các em đá bóng, nhảy dây cùng nhau. Gió mát bóng cây xanh rì.&#13;Kết bài: Em rất mến sân trường của em."
                    value={v1Outline}
                    onChange={(e) => setV1Outline(e.target.value)}
                    className="w-full p-4 text-xs font-medium text-neutral-800 bg-neutral-50/50 rounded-2xl border border-neutral-200 outline-none focus:bg-white focus:ring-2 focus:ring-amber-400/80 transition"
                  />
                </div>

            {/* Sentence Transformer inline tool */}
            <SentenceTransformer genreId={selectedGenreId} apiKey={apiKey} selectedModel={selectedModel} />

                <div className="flex items-center space-x-3">
                  <button
                    id="grade-v1-btn"
                    disabled={!v1Outline.trim() || !customTopic.trim() || isGradingV1}
                    onClick={handleGradeV1}
                    className={`px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl text-xs transition shadow-md hover:shadow-lg flex items-center space-x-2 cursor-pointer ${
                      (!v1Outline.trim() || !customTopic.trim() || isGradingV1) && 'opacity-50 cursor-not-allowed'
                    }`}
                  >
                    {isGradingV1 ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>AI Huấn luyện viên đang nghiên cứu...</span>
                      </>
                    ) : (
                      <>
                        <ClipboardCheck className="w-4 h-4" />
                        <span>Nộp Dàn Ý Lần 1 & AI Chấm Điểm 📝</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setV1Outline(`Mở bài: Giới thiệu sân trường lúc ra chơi.
Thân bài:
- Sân trường lộng gió, rất đông bạn bè đùa nghịch.
- Các nhóm đá cầu, nhóm nhảy dây hò hét vang rộn.
Kết bài: Em yêu thích giờ ra chơi ở khu sân trường.`);
                    }}
                    className="text-[11px] text-neutral-500 hover:text-amber-700 border border-neutral-200 rounded-lg py-1.5 px-3 bg-white"
                  >
                    💡 Nhập mẫu thử nghiệm nhanh
                  </button>
                </div>
              </motion.div>
            ) : !comparison ? (
              /* PANEL B: Edition 1 Score Cards & Edit Screen for Edition 2 (Upgrades) */
              <motion.div
                key="v2-edit"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
              >
                {/* Score and Task challenges Column (1 Column) */}
                <div className="space-y-6">
                  {/* Score badge card */}
                  <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border border-amber-100/50 shadow-sm text-center space-y-4">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Điểm số Lần 1</span>
                    <div className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-br from-amber-50 to-orange-50 border-4 border-amber-200/60 shadow-md score-glow">
                      <span className="text-4xl font-extrabold text-amber-700 font-sans">{v1Grade.score}</span>
                      <span className="text-xs text-amber-500 font-medium self-end mb-4">/100</span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-neutral-800">
                        {v1Grade.score >= 80 ? 'Hạng Tốt' : 'Đạt yêu cầu - Cần cải tiến'}
                      </h4>
                      <p className="text-[11px] text-neutral-500 leading-relaxed px-2">
                        {v1Grade.feedback.general}
                      </p>
                    </div>

                    {/* Skill Breakdown Stars */}
                    <div className="text-left space-y-1.5 border-t border-neutral-100 pt-3 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[11px] text-neutral-500">Hiểu đề (20đ):</span>
                        <span className="font-bold text-neutral-700">{v1Grade.criteriaScores.understand}đ</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[11px] text-neutral-500">Bố cục (20đ):</span>
                        <span className="font-bold text-neutral-700">{v1Grade.criteriaScores.structure}đ</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[11px] text-neutral-500">Phát triển ý (25đ):</span>
                        <span className="font-bold text-neutral-700">{v1Grade.criteriaScores.development}đ</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[11px] text-neutral-500">Cảm súc (20đ):</span>
                        <span className="font-bold text-neutral-700">{v1Grade.criteriaScores.creativity}đ</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[11px] text-neutral-500">Logic (15đ):</span>
                        <span className="font-bold text-neutral-700">{v1Grade.criteriaScores.logic}đ</span>
                      </div>
                    </div>
                  </div>

                  {/* Specific Rubric Checklist */}
                  <div className="bg-white p-5 rounded-2xl border border-neutral-100 space-y-3">
                    <h4 className="font-bold text-xs text-neutral-800 uppercase tracking-widest border-b border-neutral-100 pb-2">📋 Kiểm kê tiêu chí dạng bài</h4>
                    <div className="space-y-2">
                      {v1Grade.checklist.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-neutral-50/50">
                          <span className="text-neutral-600 leading-snug">{item.name}</span>
                          <span className={`text-[10px] whitespace-nowrap font-bold px-2 py-0.5 rounded-full ${
                            item.status ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-200 text-neutral-500'
                          }`}>
                            {item.status ? 'Đã đạt ✓' : 'Chưa đạt ✘'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Growth upgrade arena (2 columns) */}
                <div className="lg:col-span-2 bg-white/90 backdrop-blur-sm rounded-2xl border border-amber-100/30 shadow-sm p-6 space-y-5">
                  <div className="bg-amber-50/70 border border-amber-100 p-5 rounded-2xl space-y-2">
                    <div className="flex items-center space-x-2 text-amber-900">
                      <Award className="w-5 h-5 text-amber-600" />
                      <h4 className="font-bold text-xs uppercase tracking-wide">🎯 Nhiệm vụ nâng cấp dàn ý</h4>
                    </div>
                    <p className="text-xs text-amber-800 leading-relaxed font-medium">
                      {v1Grade.feedback.nextSteps}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-[11px] text-neutral-600">
                      <div className="p-2.5 rounded-lg bg-white/80 border border-amber-100/50 space-y-1">
                        <strong className="text-emerald-700 block">✓ Điểm mạnh của em:</strong>
                        <ul className="list-disc pl-3 text-neutral-600 space-y-1">
                          {v1Grade.feedback.strengths.slice(0, 2).map((st, idx) => (
                            <li key={idx}>{st}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white/80 border border-amber-100/50 space-y-1">
                        <strong className="text-rose-700 block">⚠ Điểm cần cải thiện gấp:</strong>
                        <ul className="list-disc pl-3 text-neutral-600 space-y-1">
                          {v1Grade.feedback.improvements.slice(0, 2).map((imp, idx) => (
                            <li key={idx}>{imp}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Multi edit panels comparison */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Locked Draft v1 */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Dự thảo Lần 1 (Đã khóa)</span>
                      <div className="w-full p-4 min-h-[180px] max-h-[300px] overflow-y-auto text-xs font-semibold text-neutral-500 bg-neutral-100 rounded-xl border border-neutral-100 whitespace-pre-wrap select-none leading-relaxed">
                        {v1Outline}
                      </div>
                    </div>

                    {/* Adjustable Draft v2 */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest block">Sửa đổi Lần 2 (Tiến bộ)</span>
                      <textarea
                        id="v2-textarea"
                        rows={10}
                        placeholder="Thêm các chi tiết, cảm xúc sinh động của riêng em vào đây để tăng hàng chục điểm!"
                        value={v2Outline}
                        onChange={(e) => setV2Outline(e.target.value)}
                        className="w-full p-4 text-xs font-semibold text-neutral-800 bg-amber-50/10 focus:bg-white rounded-xl border border-amber-200 focus:ring-2 focus:ring-amber-400 outline-none transition leading-relaxed min-h-[180px]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-neutral-100 pt-4">
                    <button
                      onClick={handleReset}
                      className="px-4 py-2 border border-neutral-200 text-neutral-500 hover:bg-neutral-50 text-xs rounded-xl transition cursor-pointer"
                    >
                      Bỏ nháp làm lại từ đầu
                    </button>

                    <button
                      id="grade-v2-btn"
                      disabled={!v2Outline.trim() || isGradingV2 || v2Outline === v1Outline}
                      onClick={handleGradeV2}
                      className={`px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl text-xs transition shadow-md hover:shadow-lg flex items-center space-x-2 cursor-pointer ${
                        (!v2Outline.trim() || isGradingV2 || v2Outline === v1Outline) && 'opacity-50 cursor-not-allowed'
                      }`}
                    >
                      {isGradingV2 ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Mạng nơ-ron đang đo đạc đối sánh...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>AI Đánh Giá Phiên Bản 2 & Đo Tiến Bộ 📈</span>
                        </>
                      )}
                    </button>
                  </div>
                  {v2Outline === v1Outline && (
                    <p className="text-[10px] text-amber-600 text-right font-medium">
                      * Hãy thực tế gõ thêm chi tiết mới vào ô "Sửa đổi Lần 2" so với bản cũ để kích hoạt đo đạc sự thăng tiến!
                    </p>
                  )}
                </div>
              </motion.div>
            ) : (
              /* PANEL C: Double-Grade Detailed Progress Analytics Dashboard */
              <motion.div
                key="comparison-dashboard"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                {/* Score Growth Display Banner */}
                <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white p-6 md:p-8 rounded-3xl shadow-lg text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-center md:justify-start space-x-2 text-amber-100">
                      <Star className="w-5 h-5 fill-amber-300 text-amber-300" />
                      <span className="text-xs font-bold uppercase tracking-widest">Growth Tracker Success</span>
                    </div>
                    <h3 className="text-xl md:text-2xl font-extrabold font-sans">📈 SỰ TIẾN BỘ CỦA EM</h3>
                    <p className="text-xs text-amber-50/95 max-w-xl leading-relaxed">
                      Huấn luyện viên AI hào hứng ghi nhận: Em đã dũng cảm nhận phản hồi, tư duy sửa đổi để kiến tạo dàn bài đạt chiều sâu vượt trội!
                    </p>
                  </div>

                  <div className="flex items-center space-x-4 bg-amber-700/30 p-4 rounded-2xl border border-white/10 shrink-0">
                    <div className="text-center">
                      <span className="text-[10px] uppercase text-amber-200 tracking-wider block">Lần 1</span>
                      <span className="text-2xl font-bold line-through opacity-70">{comparison.scoreBefore}</span>
                    </div>
                    <ArrowRight className="w-5 h-5 text-amber-200" />
                    <div className="text-center font-sans">
                      <span className="text-[10px] uppercase text-amber-200 tracking-wider block">Lần 2</span>
                      <span className="text-4xl font-black text-amber-100">{comparison.scoreAfter}</span>
                    </div>
                    <div className="bg-emerald-500/90 text-white font-bold text-xs py-1.5 px-3 rounded-lg flex items-center shadow-xs">
                      +{comparison.scoreDiff} điểm 🎉
                    </div>
                  </div>
                </div>

                {/* Skills Before vs After comparison charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Skill Matrix Visualizers */}
                  <div className="bg-white p-6 rounded-2xl border border-neutral-100 space-y-5">
                    <h4 className="font-bold text-xs text-neutral-800 uppercase tracking-widest border-b border-neutral-100 pb-2">📊 Ma Trận Chỉ Số Kỹ Năng</h4>
                    
                    <div className="space-y-4">
                      {/* Hiểu đề */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-neutral-700">1. Hiểu đề & yêu cầu (20đ)</span>
                          <span className="text-amber-600 font-bold">{comparison.skillsBefore.understand} → {comparison.skillsAfter.understand}</span>
                        </div>
                        <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden relative">
                          <div className="absolute top-0 left-0 h-full bg-neutral-300 rounded-full transition-all duration-300" style={{ width: `${(comparison.skillsBefore.understand / 20) * 100}%` }}></div>
                          <div className="absolute top-0 left-0 h-full bg-amber-500 rounded-full transition-all duration-300" style={{ width: `${(comparison.skillsAfter.understand / 20) * 100}%` }}></div>
                        </div>
                      </div>

                      {/* Bố cục */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-neutral-700">2. Bố cục 3 phần (20đ)</span>
                          <span className="text-amber-600 font-bold">{comparison.skillsBefore.structure} → {comparison.skillsAfter.structure}</span>
                        </div>
                        <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden relative">
                          <div className="absolute top-0 left-0 h-full bg-neutral-300 rounded-full" style={{ width: `${(comparison.skillsBefore.structure / 20) * 100}%` }}></div>
                          <div className="absolute top-0 left-0 h-full bg-amber-500 rounded-full" style={{ width: `${(comparison.skillsAfter.structure / 20) * 100}%` }}></div>
                        </div>
                      </div>

                      {/* Phát triển ý */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-neutral-700">3. Phát triển ý chi tiết (25đ)</span>
                          <span className="text-amber-600 font-bold">{comparison.skillsBefore.development} → {comparison.skillsAfter.development}</span>
                        </div>
                        <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden relative">
                          <div className="absolute top-0 left-0 h-full bg-neutral-300 rounded-full" style={{ width: `${(comparison.skillsBefore.development / 25) * 100}%` }}></div>
                          <div className="absolute top-0 left-0 h-full bg-emerald-500 rounded-full" style={{ width: `${(comparison.skillsAfter.development / 25) * 100}%` }}></div>
                        </div>
                      </div>

                      {/* Cảm xúc */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-neutral-700">4. Thể hiện xúc cảm & sáng tạo (20đ)</span>
                          <span className="text-emerald-600 font-bold">{comparison.skillsBefore.creativity} → {comparison.skillsAfter.creativity}</span>
                        </div>
                        <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden relative">
                          <div className="absolute top-0 left-0 h-full bg-neutral-300 rounded-full" style={{ width: `${(comparison.skillsBefore.creativity / 20) * 100}%` }}></div>
                          <div className="absolute top-0 left-0 h-full bg-emerald-500 rounded-full" style={{ width: `${(comparison.skillsAfter.creativity / 20) * 100}%` }}></div>
                        </div>
                      </div>

                      {/* Logic */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-neutral-700">5. Logic bài viết (15đ)</span>
                          <span className="text-purple-600 font-bold">{comparison.skillsBefore.logic} → {comparison.skillsAfter.logic}</span>
                        </div>
                        <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden relative">
                          <div className="absolute top-0 left-0 h-full bg-neutral-300 rounded-full" style={{ width: `${(comparison.skillsBefore.logic / 15) * 100}%` }}></div>
                          <div className="absolute top-0 left-0 h-full bg-purple-500 rounded-full" style={{ width: `${(comparison.skillsAfter.logic / 15) * 100}%` }}></div>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-neutral-50 rounded-xl space-y-1 border border-neutral-100 text-[10px] text-neutral-400">
                      <div className="flex items-center space-x-1.5"><div className="w-2.5 h-2.5 bg-neutral-300 rounded-xs"></div><span>Cấp độ bản phác Lần 1</span></div>
                      <div className="flex items-center space-x-1.5"><div className="w-2.5 h-2.5 bg-amber-500 rounded-xs"></div><span>Cấp độ cải thiện Lần 2 đạt đỉnh</span></div>
                    </div>
                  </div>

                  {/* Right Column: In-depth commentary & Before-after panel comparison (2 columns) */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Growth Commentary */}
                    <div className="bg-white p-6 rounded-2xl border border-neutral-100 space-y-4">
                      <div>
                        <h4 className="font-bold text-xs text-neutral-400 uppercase tracking-widest">🌱 Nhận xét chân dung tiến trình</h4>
                        <p className="text-xs text-neutral-700 font-medium leading-relaxed italic mt-2 bg-amber-50/20 p-4 rounded-xl border border-amber-100/30">
                          "{comparison.feedback.growthWords}"
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">🏆 Điểm cải tiến nhảy vọt:</span>
                          <p className="text-xs text-neutral-600 leading-relaxed bg-emerald-50/30 p-3 rounded-lg border border-emerald-100/50">
                            {comparison.feedback.celebration}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wide">💡 Lưu ý rèn thêm chân trời mới:</span>
                          <p className="text-xs text-neutral-600 leading-relaxed bg-amber-50/30 p-3 rounded-lg border border-amber-100/50">
                            {comparison.feedback.reminders}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Step 5: Self-Reflection & Evaluation prompts (Value-Add "Vinschool Reflection" concept) */}
                    <div className="bg-white p-6 rounded-2xl border border-neutral-100 space-y-4">
                      <div className="border-b border-neutral-100 pb-2">
                        <h4 className="font-extrabold text-sm text-neutral-800 uppercase tracking-wide flex items-center space-x-2">
                          <Star className="w-5 h-5 text-amber-500 fill-amber-500 animate-pulse" />
                          <span>Phiếu tự ngẫm để thăng hạng (Reflection Log)</span>
                        </h4>
                        <p className="text-xs text-neutral-500 mt-1">
                          Hãy viết ngắn gọn 3 câu đúc kết tự nhận thức để thấu đạt chuyển đổi viết lách sâu sắc!
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-neutral-600">1. Em đã thay đổi hay thêm bộc lộ/chi tiết gì so với lúc đầu?</label>
                          <input
                            id="reflection-q1"
                            type="text"
                            placeholder="Ví dụ: Em đã thêm âm thanh trẻ em chơi đá bóng hò reo chân thực dưới nắng gắt..."
                            value={q1Changes}
                            onChange={(e) => setQ1Changes(e.target.value)}
                            className="w-full p-2.5 text-xs text-neutral-700 bg-neutral-50 rounded-lg border border-neutral-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-400 outline-none transition"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-neutral-600">2. Thay đổi đó giúp gì cho bài tốt lên thế nào?</label>
                          <input
                            id="reflection-q2"
                            type="text"
                            placeholder="Ví dụ: Giúp người đọc ngỡ ngàng cảm thấy sân trường tràn trề nhựa sống chứ không khô khan..."
                            value={q2Reasons}
                            onChange={(e) => setQ2Reasons(e.target.value)}
                            className="w-full p-2.5 text-xs text-neutral-700 bg-neutral-50 rounded-lg border border-neutral-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-400 outline-none transition"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-neutral-600">3. Điểm gì em cần mài giũa sâu sắc hơn vào lần viết sau?</label>
                          <input
                            id="reflection-q3"
                            type="text"
                            placeholder="Ví dụ: Lần sau em sẽ chú ý viết kỹ hơn đoạn kết khép lại tâm tư ấm lòng..."
                            value={q3Learnings}
                            onChange={(e) => setQ3Learnings(e.target.value)}
                            className="w-full p-2.5 text-xs text-neutral-700 bg-neutral-50 rounded-lg border border-neutral-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-400 outline-none transition"
                          />
                        </div>
                      </div>

                      {/* Finish interactions */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-neutral-100">
                        <button
                          onClick={handleReset}
                          className="px-4 py-2 border border-neutral-200 text-neutral-500 hover:text-neutral-700 text-xs rounded-xl transition cursor-pointer"
                        >
                          Lập Dàn Ý Mới Khác
                        </button>

                        <div className="flex space-x-3 w-full sm:w-auto">
                          <button
                            id="save-portfolio-btn"
                            disabled={!q1Changes.trim() || !q2Reasons.trim() || !q3Learnings.trim() || isSaved}
                            onClick={handleSaveToPortfolio}
                            className={`w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold rounded-xl text-xs transition shadow-md hover:shadow-lg flex items-center justify-center space-x-2 cursor-pointer ${
                              (!q1Changes.trim() || !q2Reasons.trim() || !q3Learnings.trim() || isSaved) && 'opacity-65 cursor-not-allowed'
                            }`}
                          >
                            {isSaved ? (
                              <>
                                <Check className="w-4 h-4" />
                                <span>Đã Lưu Vào Portfolio Của Em 🎉</span>
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4" />
                                <span>Lưu Dàn Ý & Hoàn Tất Hoạt Động 💾</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                      {!isSaved && (!q1Changes.trim() || !q2Reasons.trim() || !q3Learnings.trim()) && (
                        <p className="text-[10px] text-amber-700 font-medium text-right italic">
                          * Hoàn thành viết Phiếu tự ngẫm 3 câu ngắn ở trên để kích hoạt nút Lưu & nhận Huy hiệu tiến hóa!
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

        {activeSubTab === 'chat' && (
          <AIChatScaffold
            topic={customTopic}
            genreId={selectedGenreId}
            apiKey={apiKey}
            selectedModel={selectedModel}
          />
        )}

        {activeSubTab === 'sample' && (
          <div className="space-y-6">
            {/* Options Card */}
            <div className="p-6 bg-white/90 backdrop-blur-sm rounded-2xl border border-amber-100/50 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="max-w-xl">
                  <h3 className="text-base font-bold text-neutral-800 flex items-center space-x-2">
                    <BookOpen className="w-5 h-5 text-emerald-500" />
                    <span>🦉 Bài viết mẫu học hỏi - Đạt Loại Giỏi</span>
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    Cú Văn sẽ viết một bài văn hoặc một đoạn văn mẫu loại giỏi, giàu hình ảnh, từ láy và cảm xúc dựa trên đề tài hoặc chính dàn ý em đã lập.
                  </p>
                </div>

                {/* Format Select */}
                <div className="flex items-center space-x-3 bg-neutral-100/80 p-1 rounded-xl self-start md:self-center border border-neutral-200/50">
                  <button
                    onClick={() => setEssayFormat('essay')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center space-x-1 ${
                      essayFormat === 'essay'
                        ? 'bg-white text-neutral-800 shadow-sm'
                        : 'text-neutral-500 hover:text-neutral-700'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Bài văn mẫu</span>
                  </button>
                  <button
                    onClick={() => setEssayFormat('paragraph')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center space-x-1 ${
                      essayFormat === 'paragraph'
                        ? 'bg-white text-neutral-800 shadow-sm'
                        : 'text-neutral-500 hover:text-neutral-700'
                    }`}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Đoạn văn ngắn</span>
                  </button>
                </div>
              </div>

              {/* Custom Draft Toggle */}
              {(v1Outline.trim() || v2Outline.trim()) && (
                <label className="flex items-center space-x-2.5 bg-amber-50/50 hover:bg-amber-50 p-3 rounded-xl border border-amber-100/30 cursor-pointer transition select-none">
                  <input
                    type="checkbox"
                    checked={useDraftOutline}
                    onChange={(e) => setUseDraftOutline(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-xs font-semibold text-neutral-700">
                    ✍️ Hãy viết bài dựa trên Dàn ý hiện tại của em (V1 hoặc V2)
                  </span>
                </label>
              )}

              {/* CTA Generate button */}
              <button
                onClick={handleGenerateEssay}
                disabled={isGeneratingEssay}
                className={`px-6 py-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold rounded-xl text-xs transition shadow-md hover:shadow-lg flex items-center space-x-2 cursor-pointer ${
                  isGeneratingEssay ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isGeneratingEssay ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Cú Văn đang chấp bút viết văn...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>🦉 Cú Văn Viết Bài Mẫu Loại Giỏi 🚀</span>
                  </>
                )}
              </button>
            </div>

            {/* Exemplary Essay View */}
            {generatedEssay && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main composition paper view */}
                <div className="lg:col-span-2 bg-amber-50/10 backdrop-blur-xs rounded-2xl border border-amber-200/40 p-6 md:p-8 shadow-sm space-y-6 relative overflow-hidden">
                  {/* Decorative lined paper style background */}
                  <div className="absolute inset-0 bg-linear bg-[size:100%_2rem] opacity-5 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 1px)' }} />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200/40 pb-4 relative z-10">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full uppercase">
                        Bài viết đạt loại giỏi
                      </span>
                      <h4 className="text-base font-extrabold text-neutral-800 mt-1">
                        📝 {essayFormat === 'essay' ? 'Bài văn mẫu tham khảo' : 'Đoạn văn mẫu tham khảo'}
                      </h4>
                      <p className="text-[11px] text-neutral-400 mt-0.5 font-medium">Chủ đề: {customTopic}</p>
                    </div>

                    {/* Highlights Toggles */}
                    <div className="flex flex-wrap gap-1.5 max-w-xs">
                      {[
                        { type: 'imagery', label: '🌿 Gợi hình', color: 'emerald' },
                        { type: 'emotion', label: '💗 Cảm xúc', color: 'pink' },
                        { type: 'rhetorical', label: '✨ Tu từ', color: 'purple' },
                        { type: 'vocabulary', label: '📚 Từ láy', color: 'amber' },
                      ].map(item => {
                        const isSelected = activeHighlights.includes(item.type);
                        return (
                          <button
                            key={item.type}
                            onClick={() => {
                              if (isSelected) {
                                setActiveHighlights(activeHighlights.filter(t => t !== item.type));
                              } else {
                                setActiveHighlights([...activeHighlights, item.type]);
                              }
                            }}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold cursor-pointer border transition-all ${
                              isSelected
                                ? `bg-${item.color}-50 text-${item.color}-700 border-${item.color}-200/60 shadow-xs`
                                : 'bg-white text-neutral-400 border-neutral-100'
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Content text block */}
                  <div className="relative z-10 bg-white/95 rounded-xl p-6 border border-amber-100/20 shadow-xs leading-relaxed max-h-[500px] overflow-y-auto font-serif tracking-wide select-text">
                    {renderEssayWithHighlights(generatedEssay.content, generatedEssay.highlights)}
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 relative z-10 pt-4 border-t border-amber-200/20">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedEssay.content);
                        alert('Đã sao chép bài viết mẫu vào bộ nhớ tạm!');
                      }}
                      className="w-full sm:w-auto px-4 py-2 bg-neutral-100 hover:bg-neutral-200/80 text-neutral-600 font-bold rounded-xl text-xs flex items-center justify-center space-x-1 cursor-pointer transition"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Sao chép toàn bài</span>
                    </button>

                    <button
                      onClick={handleSaveEssayToPortfolio}
                      className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold rounded-xl text-xs flex items-center justify-center space-x-1.5 cursor-pointer shadow-md hover:shadow-lg transition"
                    >
                      {isEssaySaved ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Đã lưu bài viết vào Portfolio 🎉</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Lưu bài mẫu vào Portfolio 💾</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Sidebar with explanations and annotations */}
                <div className="space-y-6">
                  {/* Active/Hovered Highlight Explanation */}
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-amber-100/30 shadow-sm p-5 space-y-3">
                    <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center space-x-1">
                      <HelpCircle className="w-4 h-4 text-neutral-400" />
                      <span>Chú thích nghệ thuật</span>
                    </h4>
                    {hoveredHighlight ? (
                      <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-100 space-y-2 animate-slide-up">
                        <div className="flex items-center space-x-1.5">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            hoveredHighlight.type === 'imagery' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                            hoveredHighlight.type === 'emotion' ? 'bg-pink-50 text-pink-700 border border-pink-100' :
                            hoveredHighlight.type === 'rhetorical' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                            'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>
                            {hoveredHighlight.type === 'imagery' ? '🌿 Gợi hình' :
                             hoveredHighlight.type === 'emotion' ? '💗 Cảm xúc' :
                             hoveredHighlight.type === 'rhetorical' ? '✨ Tu từ' :
                             '📚 Từ láy'}
                          </span>
                          <span className="text-[10px] font-bold text-neutral-500">"{hoveredHighlight.text}"</span>
                        </div>
                        <p className="text-xs text-neutral-600 leading-relaxed font-sans">{hoveredHighlight.explanation}</p>
                      </div>
                    ) : (
                      <div className="p-6 bg-neutral-50/50 rounded-xl border border-neutral-100/50 text-center space-y-2">
                        <div className="text-2xl">🦉</div>
                        <p className="text-xs text-neutral-500 font-medium leading-relaxed">
                          Di chuột hoặc click vào các phần được tô màu bên cạnh để xem Cú Văn chú thích các câu chữ hay nhé!
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Pedagogical Analysis */}
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-amber-100/30 shadow-sm p-5 space-y-4">
                    <h4 className="text-xs font-bold text-neutral-800 flex items-center space-x-1.5">
                      <span>💡 Điểm đặc sắc cần học hỏi</span>
                    </h4>
                    <div className="space-y-3">
                      {generatedEssay.analysis.map((item, idx) => (
                        <div key={idx} className="flex items-start space-x-2 bg-neutral-50/50 p-2.5 rounded-xl border border-neutral-100/30 text-xs text-neutral-600">
                          <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5 border border-emerald-100">
                            {idx + 1}
                          </span>
                          <span className="leading-relaxed font-medium">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
    </div>
  );
}
