import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { callGeminiApiDirectly } from '../utils/geminiDirect';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  outlinePart?: { section: string; content: string[] } | null;
}

interface AIChatScaffoldProps {
  topic: string;
  genreId: string;
  apiKey?: string;
  selectedModel?: string;
}

export default function AIChatScaffold({ topic, genreId, apiKey, selectedModel }: AIChatScaffoldProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [collectedOutline, setCollectedOutline] = useState<{ mobi: string[]; thanbi: string[]; ketbi: string[] }>({ mobi: [], thanbi: [], ketbi: [] });
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Dynamic welcome message and clear outline on genre change
  useEffect(() => {
    const welcomeMessages: Record<string, string> = {
      'ta-cay-coi': '🦉 Chào bạn nhỏ! Mình là Cú Văn đây! Hôm nay chúng mình sẽ cùng xây dựng bản đồ ý tưởng cho bài Văn tả cây cối nhé. Bạn sẵn sàng chưa? Hãy cho mình biết em muốn miêu tả cây nào nào?',
      'ke-chuyen-da-doc-da-nghe': '🦉 Chào bạn nhỏ! Mình là Cú Văn đây! Hôm nay chúng mình sẽ cùng kể lại một câu chuyện thật thú vị nhé. Bạn sẵn sàng chưa? Hãy kể cho mình biết câu chuyện em định kể là câu chuyện nào thế?',
      'cam-xuc-nhan-vat-van-hoc': '🦉 Chào bạn nhỏ! Mình là Cú Văn đây! Chúng mình cùng viết bày tỏ tình cảm về một nhân vật văn học nhé. Em sẵn sàng chưa? Hãy cho mình biết nhân vật nào để lại cho em nhiều cảm xúc nhất?',
      'thuat-lai-su-viec': '🦉 Chào bạn nhỏ! Mình là Cú Văn đây! Mỗi sự việc ý nghĩa quanh ta đều chứa đựng nhiều cảm xúc. Bạn đã sẵn sàng chưa? Hãy kể cho mình biết sự việc hay hoạt động nào em muốn thuật lại hôm nay?',
      'neu-y-kien-hien-tuong': '🦉 Chào bạn nhỏ! Mình là Cú Văn đây! Hôm nay chúng mình sẽ lập luận để bày tỏ ý kiến về một hiện tượng đời sống nhé. Em sẵn sàng chưa? Cho mình biết hiện tượng em định bàn tới là gì thế?',
      'neu-y-kien-cau-chuyen': '🦉 Chào bạn nhỏ! Mình là Cú Văn đây! Hôm nay chúng mình sẽ cùng bày tỏ ý kiến nêu lý do yêu thích một câu chuyện nhé. Bạn đã sẵn sàng chưa? Cho mình biết tên câu chuyện em muốn chia sẻ nào?',
      'cam-xuc-nguoi-than': '🦉 Chào bạn nhỏ! Mình là Cú Văn đây! Những người thân yêu luôn dành cho ta tình cảm ấm áp nhất. Hôm nay chúng mình sẽ viết bày tỏ cảm xúc về người thân nhé. Em muốn chia sẻ về ai nào?',
      'viet-thu': '🦉 Chào bạn nhỏ! Mình là Cú Văn đây! Hôm nay chúng mình sẽ cùng viết một bức thư gửi cho bạn bè hoặc người thân nhé. Em định gửi thư cho ai và nhân dịp gì thế?',
      'viet-don': '🦉 Chào bạn nhỏ! Mình là Cú Văn đây! Việc viết đơn đúng quy cách rất quan trọng. Hôm nay chúng mình sẽ viết đơn nhé. Em định viết đơn xin nghỉ học, gia nhập Đội hay đơn gì thế?',
      'ta-con-vat': '🦉 Chào bạn nhỏ! Mình là Cú Văn đây! Hôm nay chúng mình sẽ cùng tả một con vật đáng yêu và gần gũi nhé. Con vật em định tả là con vật gì thế?',
      'viet-huong-dan-bao-cao': '🦉 Chào bạn nhỏ! Mình là Cú Văn đây! Hôm nay chúng mình sẽ cùng lập dàn ý viết một bản hướng dẫn các bước hoặc báo cáo thảo luận nhóm nhé. Em muốn viết về nội dung gì thế?',
    };
    
    const welcomeText = welcomeMessages[genreId] || welcomeMessages['ta-cay-coi'];
    setMessages([
      { role: 'assistant', content: welcomeText, outlinePart: null }
    ]);
    setCollectedOutline({ mobi: [], thanbi: [], ketbi: [] });
  }, [genreId]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: ChatMessage = { role: 'user', content: input.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    const userMsgCount = updatedMessages.filter(m => m.role === 'user').length;

    // Helper: get mock response based on message count and genre
    const getMockReply = () => {
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

      const currentReplies = genreReplies[genreId] || genreReplies['ta-cay-coi'];
      const idx = Math.min(Math.max(userMsgCount - 1, 0), currentReplies.length - 1);
      return currentReplies[idx];
    };

    let data;
    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(apiKey ? { 'x-api-key': apiKey } : {}) },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          topic: topic || 'Bài viết tự do', type: genreId, model: selectedModel
        })
      });
      data = await res.json();
      if (!data.reply || data.error) {
        throw new Error(data?.error || 'Invalid API response');
      }
    } catch (err) {
      console.warn('Gemini chat failed, trying direct client call:', err);
      if (apiKey) {
        try {
          data = await callGeminiApiDirectly({
            action: 'chat',
            messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
            topic: topic || 'Bài viết tự do',
            type: genreId,
            model: selectedModel,
            apiKey
          });
        } catch (directErr) {
          console.error('Direct client-side Gemini chat failed:', directErr);
          data = getMockReply();
        }
      } else {
        data = getMockReply();
      }
    }

    try {
      const aiMsg: ChatMessage = { role: 'assistant', content: data.reply, outlinePart: data.suggestedOutlinePart || null };
      setMessages(prev => [...prev, aiMsg]);
      
      if (data.suggestedOutlinePart) {
        const { section, content } = data.suggestedOutlinePart;
        if (section && content && Array.isArray(content)) {
          setCollectedOutline(prev => ({
            ...prev,
            [section]: [...prev[section as keyof typeof prev], ...content]
          }));
        }
      }
    } catch (parseErr) {
      console.error('Failed to update chat message state:', parseErr);
    } finally {
      setIsLoading(false);
    }
  };

  const hasOutline = collectedOutline.mobi.length > 0 || collectedOutline.thanbi.length > 0 || collectedOutline.ketbi.length > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Chat Area */}
      <div className="lg:col-span-2 bg-white/90 backdrop-blur-sm rounded-2xl border border-amber-100/50 shadow-sm flex flex-col" style={{ height: '500px' }}>
        {/* Chat Header */}
        <div className="p-4 border-b border-amber-100/50 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-xl">🦉</div>
          <div>
            <h3 className="text-sm font-heading font-bold text-neutral-800">Cú Văn đồng hành</h3>
            <p className="text-[10px] text-neutral-500">Hỏi-đáp từng bước để xây dựng dàn ý</p>
          </div>
          {topic && <span className="ml-auto text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-lg truncate max-w-[200px]">{topic}</span>}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          <AnimatePresence>
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-br-md'
                    : 'bg-neutral-50 text-neutral-700 border border-neutral-100 rounded-bl-md'
                }`}>
                  {msg.content}
                  {/* Show outline suggestion card */}
                  {msg.outlinePart && (
                    <div className="mt-3 p-3 bg-white/80 rounded-xl border border-emerald-200/60 text-emerald-900">
                      <div className="flex items-center space-x-1.5 mb-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[10px] font-bold uppercase">Gợi ý {msg.outlinePart.section === 'mobi' ? 'Mở bài' : msg.outlinePart.section === 'thanbi' ? 'Thân bài' : 'Kết bài'}</span>
                      </div>
                      <ul className="space-y-1">
                        {msg.outlinePart.content.map((item, i) => (
                          <li key={i} className="flex items-start">
                            <span className="text-emerald-500 mr-1.5">•</span>
                            <span className="text-[11px]">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-neutral-50 border border-neutral-100 rounded-2xl rounded-bl-md px-4 py-3 flex items-center space-x-2">
                <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                <span className="text-xs text-neutral-500">Cú Văn đang suy nghĩ...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-neutral-100">
          <div className="flex items-center space-x-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Gõ câu trả lời cho Cú Văn..."
              className="flex-1 py-2.5 px-4 text-xs rounded-xl border border-neutral-200 focus:border-amber-400 focus:outline-none bg-neutral-50 focus:bg-white transition placeholder-neutral-400"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="p-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl disabled:opacity-50 transition cursor-pointer hover:shadow-md"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Collected Outline Sidebar */}
      <div className="lg:col-span-1 bg-white/90 backdrop-blur-sm rounded-2xl border border-emerald-100/30 shadow-sm p-5 space-y-4" style={{ maxHeight: '500px', overflowY: 'auto' }}>
        <div className="flex items-center space-x-2 border-b border-neutral-100 pb-3">
          <BookOpen className="w-4 h-4 text-emerald-600" />
          <h3 className="text-xs font-heading font-bold text-neutral-800 uppercase tracking-wider">Dàn ý đang xây</h3>
        </div>
        
        {!hasOutline ? (
          <div className="text-center py-8 text-neutral-400">
            <span className="text-3xl block mb-2">🏗️</span>
            <p className="text-[11px]">Hãy trò chuyện với Cú Văn để xây dàn ý từng bước!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {collectedOutline.mobi.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full uppercase">📖 Mở bài</span>
                <ul className="pl-3 border-l-2 border-blue-200 space-y-1">
                  {collectedOutline.mobi.map((item, i) => <li key={i} className="text-[11px] text-neutral-600">{item}</li>)}
                </ul>
              </div>
            )}
            {collectedOutline.thanbi.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full uppercase">✍️ Thân bài</span>
                <ul className="pl-3 border-l-2 border-emerald-200 space-y-1">
                  {collectedOutline.thanbi.map((item, i) => <li key={i} className="text-[11px] text-neutral-600">{item}</li>)}
                </ul>
              </div>
            )}
            {collectedOutline.ketbi.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full uppercase">🎯 Kết bài</span>
                <ul className="pl-3 border-l-2 border-purple-200 space-y-1">
                  {collectedOutline.ketbi.map((item, i) => <li key={i} className="text-[11px] text-neutral-600">{item}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
