import { EssayMetadata } from '../types';

export const SYLLABUS_DATA: EssayMetadata[] = [
  {
    id: 'ta-cay-coi',
    title: 'Văn tả cây cối',
    emoji: '🌳',
    iconName: 'camera',
    iconBg: 'from-emerald-100 to-teal-100',
    iconColor: 'text-emerald-600',
    description: 'Miêu tả vẻ đẹp, màu sắc, đặc điểm của cây ăn quả, cây hoa, hay cây bóng mát mà em yêu thích.',
    topics: [
      'Tả một cây bóng mát trên sân trường (cây bàng, cây phượng...)',
      'Tả cây ăn quả trong vườn nhà em (cây xoài, cây nhãn, cây vú sữa...)',
      'Tả một cây hoa đang đua nhau nở sắc vào mùa xuân (cây hoa mai, hoa đào, hoa hồng...)',
      'Tả một cây non em mới trồng hoặc cùng bố chăm sóc'
    ],
    template: {
      mobi: [
        'Giới thiệu cây định tả (Cây gì? Ở đâu? Ai trồng? Em quan sát lúc nào?)',
        'Cảm xúc, ấn tượng chung ban đầu về cây đó.'
      ],
      thanbi: [
        '1. Tả bao quát: Tầm nhìn từ xa (Hình dáng, chiều cao, tán lá rộng hay hẹp).',
        '2. Tả chi tiết theo thời gian hoặc bộ phận:',
        '- Tả các bộ phận: Gốc, rễ, thân, cành, lá, hoa, quả (nếu có).',
        '- Sự thay đổi của cây qua các mùa hoặc dưới nắng, mưa.',
        '3. Hoạt động của con người hoặc loài vật (chim chóc, ong bướm) gắn với cây.'
      ],
      ketbi: [
        'Khẳng định ích lợi của cây đối với cuộc sống.',
        'Bộc lộ tình cảm gắn bó của em với cây (Cách chăm sóc, tưới nước, giữ gìn cây).'
      ]
    },
    aiRules: {
      mustHave: [
        'Xác định rõ cây cần tả ở phần mở bài',
        'Có miêu tả bao quát dáng vẻ của cây',
        'Miêu tả chi tiết các bộ phận (thân, lá, hoa hoặc quả)',
        'Sử dụng biện pháp so sánh hoặc nhân hóa tự nhiên',
        'Bày tỏ tình cảm chăm sóc cây ở kết bài'
      ],
      shouldAvoid: [
        'Liệt kê bộ phận khô khan giống như bài học Sinh học',
        'Thiếu các từ ngữ miêu tả màu sắc, hình dáng sinh động',
        'Bố cục lộn xộn, không tả theo trình tự rõ ràng'
      ]
    }
  },
  {
    id: 'ke-chuyen-da-doc-da-nghe',
    title: 'Kể lại câu chuyện đã đọc, đã nghe',
    emoji: '📖',
    iconName: 'book-open',
    iconBg: 'from-purple-100 to-violet-100',
    iconColor: 'text-purple-600',
    description: 'Kể lại một câu chuyện cổ tích, ngụ ngôn hoặc danh nhân lịch sử mà em đã đọc hoặc được nghe kể bằng lời văn của mình.',
    topics: [
      'Kể lại câu chuyện "Sự tích hồ Ba Bể" bằng lời của em',
      'Kể lại câu chuyện ngụ ngôn "Rùa và Thỏ" và bài học rút ra',
      'Kể lại câu chuyện về một người có nghị lực vượt khó mà em ngưỡng mộ',
      'Kể lại câu chuyện cổ tích "Tấm Cám" (phần Tấm vượt qua khó khăn)'
    ],
    template: {
      mobi: [
        'Giới thiệu câu chuyện định kể (Tên chuyện là gì? Em đọc ở đâu hay nghe ai kể?)',
        'Nêu sơ lược nhân vật chính hoặc ấn tượng sâu sắc nhất.'
      ],
      thanbi: [
        '1. Sự việc mở đầu dẫn dắt câu chuyện.',
        '2. Diễn biến các sự việc tiếp theo theo trình tự thời gian:',
        '- Sự việc 1, sự việc 2, sự việc 3 dẫn tới đỉnh điểm câu chuyện.',
        '- Cách giải quyết vấn đề hoặc nút thắt câu chuyện.',
        '3. Sự việc kết thúc câu chuyện.'
      ],
      ketbi: [
        'Nêu kết cục chung của câu chuyện.',
        'Rút ra bài học đạo đức ý nghĩa hoặc suy nghĩ sâu sắc của bản thân từ câu chuyện.'
      ]
    },
    aiRules: {
      mustHave: [
        'Giới thiệu được tên câu chuyện và nguồn gốc',
        'Sắp xếp các sự việc theo trình tự thời gian logic',
        'Dùng lời văn của mình, tránh sao chép hoàn toàn nguyên văn sách',
        'Nêu được bài học đạo đức rõ ràng ở kết bài'
      ],
      shouldAvoid: [
        'Kể quá vắn tắt làm mất đi tính hấp dẫn của truyện',
        'Thay đổi sai lệch cốt truyện hoặc các chi tiết quan trọng',
        'Lời văn kể chuyện khô khan, thiếu biểu cảm'
      ]
    }
  },
  {
    id: 'cam-xuc-nhan-vat-van-hoc',
    title: 'Cảm xúc về nhân vật văn học',
    emoji: '🎬',
    iconName: 'heart-handshake',
    iconBg: 'from-pink-100 to-rose-100',
    iconColor: 'text-pink-600',
    description: 'Viết đoạn văn bày tỏ tình cảm, cảm xúc chân thành đối với một nhân vật văn học trong truyện hoặc thơ em đã đọc.',
    topics: [
      'Nêu tình cảm, cảm xúc của em về nhân vật người con hiếu thảo trong câu chuyện "Bông hoa cúc trắng"',
      'Bày tỏ cảm xúc của em về nhân vật chú Dế Mèn qua bài học đường đời đầu tiên',
      'Nêu cảm nghĩ về nhân vật cậu bé Lượm dũng cảm, hồn nhiên trong bài thơ "Lượm" của Tố Hữu',
      'Nêu tình cảm của em đối với nhân vật Thánh Gióng trong câu chuyện truyền thuyết cùng tên'
    ],
    template: {
      mobi: [
        'Giới thiệu nhân vật gây ấn tượng mạnh (Tên nhân vật, trong tác phẩm nào).',
        'Khái quát tình cảm chung của em dành cho nhân vật (Yêu mến, khâm phục, thương cảm...).'
      ],
      thanbi: [
        '1. Những đặc điểm của nhân vật khiến em xúc động hoặc yêu thích:',
        '- Về phẩm chất, tính cách tốt đẹp (hiếu thảo, dũng cảm, nhân hậu...).',
        '- Về những hành động, lời nói đáng chú ý của nhân vật.',
        '2. Chi tiết, sự việc cụ thể trong truyện làm em nhớ nhất ở nhân vật này.',
        '3. Liên hệ bản thân: Học được phẩm chất gì từ nhân vật đó.'
      ],
      ketbi: [
        'Khẳng định lại vị trí và tình cảm sâu sắc của em đối với nhân vật.',
        'Mong ước hoặc lời hứa noi gương phẩm chất tốt của nhân vật.'
      ]
    },
    aiRules: {
      mustHave: [
        'Nêu rõ tên nhân vật và tác phẩm chứa nhân vật đó',
        'Lựa chọn phẩm chất hoặc hành động tiêu biểu của nhân vật để bày tỏ cảm xúc',
        'Sử dụng các từ ngữ bộc lộ cảm xúc trực tiếp (thương mến, kính phục, tự hào...)',
        'Rút ra bài học bản thân từ nhân vật'
      ],
      shouldAvoid: [
        'Lạc sang kể lại tóm tắt câu chuyện thay vì bộc lộ cảm xúc',
        'Khen ngợi chung chung không gắn liền với chi tiết cụ thể trong sách',
        'Thiếu sự gắn kết cảm xúc cá nhân'
      ]
    }
  },
  {
    id: 'thuat-lai-su-viec',
    title: 'Thuật lại một sự việc',
    emoji: '❤️',
    iconName: 'heart',
    iconBg: 'from-red-100 to-orange-100',
    iconColor: 'text-red-500',
    description: 'Thuật lại một hoạt động, sự việc mà em đã được chứng kiến hoặc tham gia (lễ khai giảng, buổi lao động dọn vệ sinh, buổi dã ngoại...).',
    topics: [
      'Thuật lại một buổi lao động dọn dẹp vệ sinh lớp học hoặc sân trường của lớp em',
      'Thuật lại không khí trang nghiêm và rộn rã của buổi lễ khai giảng năm học mới',
      'Thuật lại một việc tốt em hoặc bạn em đã làm để giúp đỡ người xung quanh',
      'Thuật lại một buổi sinh hoạt lớp hoặc trò chơi tập thể đáng nhớ'
    ],
    template: {
      mobi: [
        'Giới thiệu sự việc cần thuật lại (Sự việc gì? Diễn ra lúc nào? Ở đâu? Em tham gia hay chứng kiến?)',
        'Cảm xúc chung của em trước khi sự việc bắt đầu.'
      ],
      thanbi: [
        '1. Giai đoạn chuẩn bị (Không khí, công việc chuẩn bị của mọi người).',
        '2. Diễn biến chính của sự việc theo trình tự thời gian (Trước - Trong - Sau):',
        '- Sự việc mở đầu.',
        '- Sự việc tiếp diễn (hoạt động sôi nổi nhất, những chi tiết đáng nhớ nhất).',
        '- Sự việc kết thúc.',
        '3. Thái độ, tinh thần và nét mặt của những người tham gia.'
      ],
      ketbi: [
        'Kết quả của sự việc đó.',
        'Nêu cảm nghĩ, ý nghĩa của hoạt động đó đối với em và tập thể (vui vẻ, đoàn kết, tự hào).'
      ]
    },
    aiRules: {
      mustHave: [
        'Nêu rõ thời gian, địa điểm và tên sự việc',
        'Thuật lại đầy đủ tiến trình các sự việc chính theo trình tự hợp lý',
        'Kết hợp tả cảnh và tả hoạt động của con người để bài viết sống động',
        'Bộc lộ cảm xúc chân thật xuyên suốt tiến trình'
      ],
      shouldAvoid: [
        'Liệt kê công việc quá khô khan như biên bản họp lớp',
        'Bố cục lộn xộn, không tuân theo thứ tự thời gian',
        'Kể lan man thiếu tập trung vào hoạt động chính'
      ]
    }
  },
  {
    id: 'neu-y-kien-hien-tuong',
    title: 'Nêu ý kiến về một hiện tượng',
    emoji: '💡',
    iconName: 'scale',
    iconBg: 'from-blue-100 to-sky-100',
    iconColor: 'text-blue-600',
    description: 'Trình bày suy nghĩ, ý kiến của em về một hiện tượng học đường hoặc sự việc gần gũi trong đời sống.',
    topics: [
      'Trình bày ý kiến về việc: Học sinh tiểu học có nên tham gia làm việc nhà giúp đỡ cha mẹ?',
      'Viết đoạn văn nêu ý kiến về hiện tượng vứt rác bừa bãi ở trường học hoặc nơi công cộng',
      'Nêu ý kiến của em về lợi ích của việc đọc sách giấy mỗi ngày đối với học sinh lớp 4',
      'Nêu suy nghĩ của em về hiện tượng các bạn học sinh thích chơi game online quá nhiều'
    ],
    template: {
      mobi: [
        'Dẫn dắt nêu vấn đề hoặc hiện tượng cần bàn luận.',
        'Khẳng định rõ lập trường của em (Đồng tình/ủng hộ hay không đồng tình/phản đối).'
      ],
      thanbi: [
        '1. Lý lẽ 1 giải thích lý do chính vì sao em có ý kiến như vậy.',
        '2. Lý lẽ 2 củng cố bằng ví dụ, dẫn chứng thực tế từ đời sống học đường hoặc gia đình.',
        '- Phân tích mặt tốt/lợi ích (nếu đồng tình) hoặc tác hại/hệ lụy (nếu phản đối).',
        '3. Nhận định hướng giải quyết hoặc cách hành xử đúng đắn.'
      ],
      ketbi: [
        'Khẳng định lại ý kiến của mình một lần nữa.',
        'Đề xuất hành động hoặc lời khuyên thiết thực dành cho bạn bè.'
      ]
    },
    aiRules: {
      mustHave: [
        'Bày tỏ quan điểm rõ ràng ngay từ mở đoạn',
        'Có ít nhất hai lý lẽ thuyết phục',
        'Đưa ra dẫn chứng thực tế minh họa cho lý lẽ',
        'Lời văn gãy gọn, lập luận logic'
      ],
      shouldAvoid: [
        'Quan điểm mơ hồ, không rõ là đồng tình hay phản đối',
        'Chỉ nói lý thuyết suông, thiếu dẫn chứng thực tiễn',
        'Dùng ngôn ngữ quá gay gắt hoặc thiếu tôn trọng'
      ]
    }
  },
  {
    id: 'neu-y-kien-cau-chuyen',
    title: 'Nêu lý do yêu thích câu chuyện',
    emoji: '📘',
    iconName: 'book',
    iconBg: 'from-teal-100 to-emerald-100',
    iconColor: 'text-teal-600',
    description: 'Viết đoạn văn giải thích lý do vì sao em yêu thích một câu chuyện cổ tích, ngụ ngôn đã đọc hoặc nghe kể.',
    topics: [
      'Nêu lí do em thích câu chuyện "Sự tích dưa hấu" (Mai An Tiêm)',
      'Nêu lí do em yêu thích câu chuyện ngụ ngôn "Trí khôn của ta đây"',
      'Viết đoạn văn nêu lí do em thích một câu chuyện kể về tình bạn đẹp trong cuộc sống',
      'Giải thích lý do em yêu mến câu chuyện "Thạch Sanh" dũng cảm cứu người'
    ],
    template: {
      mobi: [
        'Giới thiệu câu chuyện em yêu thích (Tên câu chuyện, thể loại).',
        'Khái quát lý do lớn nhất khiến em yêu thích câu chuyện.'
      ],
      thanbi: [
        '1. Lý do về nội dung câu chuyện (Ý nghĩa nhân văn, bài học sâu sắc, cốt truyện hấp dẫn...).',
        '2. Lý do về nhân vật em yêu thích (Hành động đẹp, tính cách kiên cường, dũng cảm...).',
        '- Nêu một chi tiết hoặc tình huống đắt giá trong câu chuyện làm em nhớ mãi.',
        '3. Nhận xét về cách kể chuyện hoặc chi tiết kỳ ảo (nếu có) tạo nên sức hút.'
      ],
      ketbi: [
        'Khẳng định lại giá trị của câu chuyện trong lòng em.',
        'Khuyên bạn bè nên tìm đọc câu chuyện ý nghĩa này.'
      ]
    },
    aiRules: {
      mustHave: [
        'Chỉ ra tên câu chuyện và tác phẩm',
        'Trình bày rõ ràng các lý do (nội dung, nhân vật hoặc nghệ thuật)',
        'Có ví dụ cụ thể về chi tiết/tình huống làm nên sự yêu thích',
        'Diễn đạt tự nhiên, giàu tình cảm'
      ],
      shouldAvoid: [
        'Tóm tắt lại toàn bộ diễn biến câu chuyện thay vì nêu lý do yêu thích',
        'Nói chung chung như "câu chuyện rất hay" mà không chỉ rõ hay ở điểm nào',
        'Bố cục lộn xộn, thiếu sự liên kết giữa các câu'
      ]
    }
  },
  {
    id: 'cam-xuc-nguoi-than',
    title: 'Cảm xúc về người thân',
    emoji: '🌹',
    iconName: 'heart',
    iconBg: 'from-rose-100 to-pink-100',
    iconColor: 'text-rose-500',
    description: 'Bày tỏ tình cảm, lòng biết ơn và cảm xúc chân thành đối với người thân yêu trong gia đình hoặc thầy cô, bạn bè gần gũi.',
    topics: [
      'Nêu tình cảm, cảm xúc của em đối với người mẹ kính yêu luôn chăm sóc em',
      'Bày tỏ cảm xúc, lòng biết ơn đối với người thầy hoặc cô giáo đã dạy dỗ em tiến bộ',
      'Nêu cảm nghĩ và tình cảm của em đối với người bạn thân thiết nhất lớp 4',
      'Nêu cảm xúc của em đối với người ông hoặc người bà kính yêu luôn kể chuyện cổ tích cho em nghe'
    ],
    template: {
      mobi: [
        'Giới thiệu người thân mà em muốn bày tỏ tình cảm (Là ai? Mối quan hệ thế nào?).',
        'Cảm nhận khái quát về tình thương yêu của người đó đối với em.'
      ],
      thanbi: [
        '1. Những nét đặc trưng gợi nhớ đầy tình cảm (Ánh mắt hiền từ, đôi bàn tay ấm áp, nụ cười hiền hậu...).',
        '2. Sự chăm sóc, yêu thương cụ thể của người đó dành cho em (Nấu món ngon, giảng bài, lo lắng khi em ốm...).',
        '3. Kỷ niệm đáng nhớ nhất giữa em và người đó.',
        '4. Cảm xúc kính yêu, biết ơn và trân trọng sâu sắc của em.'
      ],
      ketbi: [
        'Khẳng định tình yêu thương vô bờ đối với người thân.',
        'Tự hứa ngoan ngoãn học tập tốt để đem lại niềm vui cho người đó.'
      ]
    },
    aiRules: {
      mustHave: [
        'Giới thiệu được người thân yêu cần viết',
        'Đưa ra các cử chỉ chăm sóc hoặc hành động ấm áp cụ thể của người đó',
        'Sử dụng nhiều từ ngữ bộc lộ cảm xúc chân thật (biết ơn, ấm lòng, yêu thương...)',
        'Nêu lời hứa chân thành của bản thân ở phần kết'
      ],
      shouldAvoid: [
        'Lạc sang tả ngoại hình người thân quá chi tiết từ đầu đến chân như bài văn tả người',
        'Kể chuyện lan man không làm nổi bật tình cảm cảm xúc',
        'Lời văn sáo rỗng, thiếu tình cảm thực sự'
      ]
    }
  },
  {
    id: 'viet-thu',
    title: 'Viết thư',
    emoji: '✉️',
    iconName: 'book-open',
    iconBg: 'from-blue-100 to-indigo-100',
    iconColor: 'text-blue-600',
    description: 'Học cách viết thư thăm hỏi, chúc mừng hoặc chia sẻ niềm vui, nỗi buồn với bạn bè, người thân ở xa theo cấu trúc chuẩn.',
    topics: [
      'Viết thư cho bạn cũ ở trường tiểu học cũ để thăm hỏi và kể về tình hình học tập lớp 4 của em',
      'Viết thư chúc mừng sinh nhật một người thân trong gia đình (ông, bà, cô, chú...) đang ở xa',
      'Viết một bức thư ngắn gửi cho một người bạn kể về một chuyến du lịch hè đáng nhớ của gia đình em',
      'Viết thư cho bạn học cũ để chia sẻ niềm vui khi em đạt giải cao trong cuộc thi viết chữ đẹp'
    ],
    template: {
      mobi: [
        'Địa điểm và thời gian viết thư (Ví dụ: Hà Nội, ngày... tháng... năm...).',
        'Lời xưng hô chào hỏi đầu thư thân thiện phù hợp với người nhận thư.'
      ],
      thanbi: [
        '1. Lý do viết thư (Nhân dịp sinh nhật, lâu ngày không gặp, nghe tin bạn chuyển trường...).',
        '2. Hỏi thăm tình hình người nhận thư (Sức khỏe, học tập, công việc...).',
        '3. Thông báo tình hình bản thân người viết (Sức khỏe, việc học tập tại lớp 4, gia đình...).',
        '4. Bày tỏ tình cảm, sự nhớ nhung hoặc mong mỏi hồi âm.'
      ],
      ketbi: [
        'Lời chúc và lời hứa hẹn tốt đẹp.',
        'Chữ ký và họ tên của người viết thư.'
      ]
    },
    aiRules: {
      mustHave: [
        'Đảm bảo cấu trúc 3 phần của bức thư (Mở đầu, Nội dung chính, Cuối thư)',
        'Ghi rõ ngày tháng, địa điểm viết thư ở đầu',
        'Lời xưng hô phù hợp với người nhận (VD: Ông bà kính yêu, Bạn thân mến...)',
        'Nội dung thăm hỏi chân thành và chia sẻ thông tin thiết thực'
      ],
      shouldAvoid: [
        'Thiếu các phần bắt buộc như ngày tháng hoặc chữ ký cuối thư',
        'Xưng hô không phù hợp với đối tượng nhận thư',
        'Nội dung quá ngắn ngủi, cụt lủn không rõ mục đích viết thư'
      ]
    }
  },
  {
    id: 'viet-don',
    title: 'Viết đơn',
    emoji: '📝',
    iconName: 'pen-tool',
    iconBg: 'from-amber-100 to-yellow-100',
    iconColor: 'text-amber-600',
    description: 'Rèn luyện kỹ năng viết đơn xin nghỉ học, đơn xin tham gia câu lạc bộ, hoặc đơn xin gia nhập Đội chuẩn xác.',
    topics: [
      'Viết đơn xin nghỉ học gửi thầy cô giáo chủ nhiệm lớp 4 vì lý do bị ốm',
      'Viết đơn xin tham gia một câu lạc bộ năng khiếu thể thao hoặc nghệ thuật của trường',
      'Viết đơn xin gia nhập Chi đội Thiếu niên Tiền phong Hồ Chí Minh của lớp em',
      'Viết đơn xin mượn sách thư viện trường chuẩn bị cho buổi đọc sách tập thể'
    ],
    template: {
      mobi: [
        'Quốc hiệu và Tiêu ngữ (CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM...).',
        'Địa điểm, ngày tháng năm viết đơn.',
        'Tên đơn (Ví dụ: ĐƠN XIN NGHỈ HỌC viết in hoa).'
      ],
      thanbi: [
        '1. Nơi nhận đơn (Kính gửi: Cô giáo chủ nhiệm và Ban giám hiệu...).',
        '2. Thông tin người viết đơn (Họ tên, ngày sinh, học sinh lớp...).',
        '3. Lý do viết đơn (Lý do bị ốm cần nghỉ học, lý do muốn tham gia câu lạc bộ...).',
        '4. Lời cam kết hoặc hứa thực hiện nghiêm túc quy định của lớp, của câu lạc bộ.'
      ],
      ketbi: [
        'Lời cảm ơn chân thành gửi đến người nhận đơn.',
        'Chữ ký và họ tên của người làm đơn (hoặc ý kiến của phụ huynh nếu cần).'
      ]
    },
    aiRules: {
      mustHave: [
        'Có Quốc hiệu, Tiêu ngữ và Tên đơn viết in hoa nổi bật',
        'Ghi rõ địa chỉ kính gửi chính xác',
        'Trình bày đầy đủ thông tin cá nhân của người viết đơn',
        'Lý do viết đơn rõ ràng, chính đáng và có lời cảm ơn ở cuối'
      ],
      shouldAvoid: [
        'Trình bày cẩu thả, sai quy cách văn bản hành chính',
        'Viết đơn giống như một bức thư hay bài văn miêu tả',
        'Thiếu chữ ký hoặc họ tên ở cuối đơn'
      ]
    }
  },
  {
    id: 'ta-con-vat',
    title: 'Văn tả con vật',
    emoji: '🐱',
    iconName: 'user',
    iconBg: 'from-orange-100 to-amber-100',
    iconColor: 'text-orange-500',
    description: 'Miêu tả hình dáng đáng yêu, hoạt động nhanh nhẹn và ích lợi của một con vật nuôi trong nhà hoặc con vật em yêu mến.',
    topics: [
      'Tả chú chó trung thành, tinh nghịch nuôi trong gia đình em',
      'Tả chú mèo mướp bắt chuột giỏi và ngoan ngoãn thích sưởi nắng',
      'Tả chú gà trống oai vệ gáy vang báo thức mọi người vào mỗi buổi sáng',
      'Tả một chú chim bồ câu biểu tượng hòa bình em quan sát ở công viên'
    ],
    template: {
      mobi: [
        'Giới thiệu con vật định tả (Con vật gì? Nuôi từ lúc nào? Ai mua/tặng? Ấn tượng ban đầu).'
      ],
      thanbi: [
        '1. Tả hình dáng bên ngoài nổi bật:',
        '- Vóc dáng, màu lông, cái đầu, đôi mắt lanh lợi.',
        '- Đôi tai, cái mũi, bốn chân và cái đuôi ngoáy tít.',
        '2. Tả hoạt động và thói quen sinh hoạt:',
        '- Cách con vật di chuyển, tìm thức ăn, đùa giỡn với em.',
        '- Ích lợi của con vật đối với đời sống (Trông nhà, bắt chuột, báo thức...).'
      ],
      ketbi: [
        'Nêu tình cảm mến yêu sâu sắc của em đối với con vật.',
        'Ý thức chăm sóc cho con vật (cho ăn, tắm rửa, chơi cùng).'
      ]
    },
    aiRules: {
      mustHave: [
        'Xác định rõ con vật miêu tả ở mở bài',
        'Tả ngoại hình nổi bật (màu lông, mắt, tai, chân...)',
        'Tả hoạt động đặc trưng đáng yêu của con vật',
        'Sử dụng các từ ngữ mô tả âm thanh, cử chỉ sinh động',
        'Thể hiện tình cảm gắn bó ở kết bài'
      ],
      shouldAvoid: [
        'Liệt kê các chi tiết con vật rời rạc, thiếu liên kết',
        'Tả con vật giống như một loài thú dữ tợn phi thực tế',
        'Thiếu các chi tiết về hoạt động gắn bó giữa người và vật'
      ]
    }
  },
  {
    id: 'viet-huong-dan-bao-cao',
    title: 'Viết hướng dẫn / Báo cáo',
    emoji: '📋',
    iconName: 'calendar',
    iconBg: 'from-cyan-100 to-sky-100',
    iconColor: 'text-cyan-600',
    description: 'Viết hướng dẫn các bước thực hiện một công việc đơn giản hoặc viết báo cáo thảo luận nhóm của tổ em một cách mạch lạc.',
    topics: [
      'Viết hướng dẫn các bước gấp một chiếc thuyền giấy hoặc máy bay giấy đơn giản',
      'Viết báo cáo kết quả thảo luận nhóm của tổ em về việc chuẩn bị văn nghệ chào mừng ngày 20-11',
      'Viết hướng dẫn các bước chăm sóc và tưới cây xanh tại lớp học lớp 4',
      'Viết báo cáo kết quả tự học nhóm để ôn tập chuẩn bị thi học kì I'
    ],
    template: {
      mobi: [
        'Nêu mục đích của bản hướng dẫn hoặc báo cáo (Ví dụ: Hướng dẫn gấp máy bay giấy; Báo cáo thảo luận tổ...).'
      ],
      thanbi: [
        '1. Đối với bản hướng dẫn:',
        '- Liệt kê nguyên vật liệu cần chuẩn bị.',
        '- Hướng dẫn chi tiết từng bước thực hiện (Bước 1, Bước 2, Bước 3...) theo trình tự hợp lý.',
        '2. Đối với bản báo cáo thảo luận nhóm:',
        '- Thời gian, địa điểm, thành phần tham dự.',
        '- Nội dung thảo luận và kết quả thống nhất của nhóm (Ai làm việc gì, hạn hoàn thành...).'
      ],
      ketbi: [
        'Nêu kết quả đạt được sau khi làm xong hoặc ý nghĩa của việc làm/buổi thảo luận.'
      ]
    },
    aiRules: {
      mustHave: [
        'Bố cục rõ ràng, tiêu đề bản hướng dẫn hoặc báo cáo nổi bật',
        'Các bước thực hiện được đánh số hoặc sắp xếp mạch lạc theo trình tự thời gian',
        'Nội dung phân công công việc cụ thể rõ ràng (nếu là báo cáo)',
        'Từ ngữ ngắn gọn, dễ hiểu, mang tính chỉ dẫn hoặc ghi nhận'
      ],
      shouldAvoid: [
        'Viết lan man giống như kể chuyện, thiếu tính khoa học',
        'Thiếu các bước cơ bản hoặc thông tin người thực hiện nhiệm vụ',
        'Các bước hướng dẫn bị đảo lộn không đúng logic quy trình'
      ]
    }
  }
];

export const VOCABULARY_BANK = {
  'ta-cay-coi': {
    title: '🌿 Từ vựng Văn Tả Cây Cối',
    categories: [
      { name: 'Hình dáng & Thân cành', words: ['xum xuê', 'tán lá rộng', 'gốc rễ sần sùi', 'cành lá khẳng khiu', 'vươn cao kiêu hãnh', 'vỏ thân thô ráp', 'tán lá như chiếc ô che mát'] },
      { name: 'Màu sắc & Hoa quả', words: ['xanh mướt', 'đỏ rực rỡ', 'nhuộm vàng nắng thu', 'trĩu quả ngọt lành', 'hương thơm dìu dịu', 'hoa nở chúm chím', 'cánh hoa mịn màng'] },
      { name: 'Tác động thiên nhiên', words: ['rì rào trong gió', 'lung linh dưới nắng xuân', 'đón hạt mưa bụi', 'tắm mát sương đêm', 'lấp lánh hạt nắng'] }
    ]
  },
  'ke-chuyen-da-doc-da-nghe': {
    title: '📖 Từ vựng Kể Chuyện Đã Đọc, Đã Nghe',
    categories: [
      { name: 'Từ nối thời gian', words: ['ngày xửa ngày xưa', 'từ thuở ấy', 'bỗng nhiên', 'thế rồi', 'kể từ đó', 'cuối cùng', 'trải qua nhiều gian nan'] },
      { name: 'Tình tiết & Phép thuật', words: ['tiên ông hiện lên', 'phép thuật kỳ diệu', 'hóa phép cứu giúp', 'tấm lòng nhân hậu', 'ở hiền gặp lành', 'nghị lực phi thường', 'vượt qua thử thách'] },
      { name: 'Bài học đúc kết', words: ['bài học thấm thía', 'gieo nhân nào gặt quả nấy', 'biết ơn sâu sắc', 'lòng hiếu thảo sáng ngời', 'đoàn kết làm nên sức mạnh'] }
    ]
  },
  'cam-xuc-nhan-vat-van-hoc': {
    title: '🎬 Từ vựng Cảm xúc về Nhân vật Văn học',
    categories: [
      { name: 'Đặc điểm tính cách', words: ['hiếu thảo vô ngần', 'nhân hậu ấm áp', 'dũng cảm can trường', 'hồn nhiên tinh nghịch', 'chăm chỉ chịu khó', 'kiên cường vượt khó'] },
      { name: 'Cảm xúc kính khâm', words: ['xúc động nghẹn ngào', 'khâm phục vô ngần', 'thương cảm sâu sắc', 'ngưỡng mộ thiết tha', 'học tập tấm gương', 'lay động trái tim'] },
      { name: 'Chi tiết ấn tượng', words: ['hình ảnh dũng cảm', 'hành động cao đẹp', 'lời nói chân thành', 'ánh mắt tràn đầy hiếu thảo', 'sự hy sinh thầm lặng'] }
    ]
  },
  'thuat-lai-su-viec': {
    title: '❤️ Từ vựng Thuật lại Sự việc',
    categories: [
      { name: 'Không khí & Chuẩn bị', words: ['rộn ràng náo nức', 'trang nghiêm long trọng', 'hăng hái nhiệt tình', 'chuẩn bị chu đáo', 'nhộn nhịp khẩn trương', 'tập trung đông đủ'] },
      { name: 'Hoạt động & Diễn biến', words: ['nhanh nhẹn khéo léo', 'phối hợp ăn ý', 'mỗi người một việc', 'tiếng trống rộn rã', 'nụ cười rạng rỡ', 'tay năm tay mười'] },
      { name: 'Kết quả cảm xúc', words: ['hoàn thành xuất sắc', 'niềm vui vỡ òa', 'mệt nhưng rất vui', 'gắn kết tình bạn', 'kỷ niệm khó quên', 'tự hào vô cùng'] }
    ]
  },
  'neu-y-kien-hien-tuong': {
    title: '💡 Từ vựng Biện luận Nêu Ý kiến Hiện tượng',
    categories: [
      { name: 'Bày tỏ quan điểm', words: ['hoàn toàn đồng tình', 'không đồng tình với việc', 'ủng hộ nhiệt tình', 'nhận thấy rõ lợi ích', 'kiên quyết phản đối'] },
      { name: 'Lập luận kết nối', words: ['trước hết cần thấy', 'bên cạnh đó', 'hơn thế nữa', 'minh chứng thực tế là', 'ngược lại nếu chúng ta'] },
      { name: 'Kêu gọi & Khuyên răn', words: ['hãy cùng nhau hành động', 'hình thành thói quen tốt', 'bảo vệ môi trường', 'trách nhiệm của mỗi học sinh', 'xây dựng lối sống đẹp'] }
    ]
  },
  'neu-y-kien-cau-chuyen': {
    title: '📘 Từ vựng Nêu Lý do yêu thích Câu chuyện',
    categories: [
      { name: 'Nội dung cốt truyện', words: ['cốt truyện hấp dẫn', 'chi tiết ly kỳ', 'kết thúc có hậu', 'giàu tính nhân văn', 'bài học giáo dục sâu sắc', 'ý nghĩa thời gian'] },
      { name: 'Đặc sắc nghệ thuật', words: ['hình ảnh kỳ ảo', 'chi tiết ẩn dụ tinh tế', 'lối kể chuyện sinh động', 'xây dựng nhân vật độc đáo', 'ngôn từ dung dị gần gũi'] },
      { name: 'Sự yêu mến tiếp nhận', words: ['đọc đi đọc lại', 'ấn tượng sâu đậm', 'khuyên mọi người nên đọc', 'nuôi dưỡng tâm hồn em', 'mở ra thế giới tưởng tượng'] }
    ]
  },
  'cam-xuc-nguoi-than': {
    title: '🌹 Từ vựng Cảm xúc về Người thân',
    categories: [
      { name: 'Cử chỉ yêu thương', words: ['ân cần dạy dỗ', 'tảo tần chăm sóc', 'đôi tay chai sần ấm áp', 'nụ cười hiền hậu', 'ánh mắt trìu mến', 'lo lắng sốt sắng'] },
      { name: 'Xúc cảm kính thương', words: ['kính yêu vô hạn', 'biết ơn sâu sắc', 'ấm lòng lạ thường', 'mong muốn được đền đáp', 'khắc sâu trong lòng', 'chỗ dựa bình yên'] },
      { name: 'Lời hứa bản thân', words: ['cố gắng chăm ngoan', 'đạt điểm tốt dâng mẹ', 'giúp đỡ việc nhà', 'nghe lời dạy bảo', 'luôn là con ngoan trò giỏi'] }
    ]
  },
  'viet-thu': {
    title: '✉️ Từ vựng Viết thư',
    categories: [
      { name: 'Chào hỏi xưng hô', words: ['kính yêu', 'thân mến', 'yêu quý', 'nhớ mong', 'lâu ngày không gặp', 'gửi lời chào trân trọng'] },
      { name: 'Hỏi thăm thông báo', words: ['tình hình học tập lớp 4', 'sức khỏe dồi dào', 'chúc mừng sinh nhật', 'chia sẻ niềm vui', 'kể chuyện đi chơi hè', 'đạt học sinh xuất sắc'] },
      { name: 'Lời chúc hứa hẹn', words: ['chúc ông bà mạnh khỏe', 'mong sớm nhận được thư bạn', 'hứa học tập thật tốt', 'luôn nhớ về bạn', 'thân ái'] }
    ]
  },
  'viet-don': {
    title: '📝 Từ vựng Viết đơn',
    categories: [
      { name: 'Kính gửi xưng hô', words: ['Kính gửi cô giáo chủ nhiệm', 'Kính gửi Ban giám hiệu nhà trường', 'Kính gửi Ban phụ trách câu lạc bộ', 'học sinh lớp 4', 'đại diện cho chi đội'] },
      { name: 'Lý do chính đáng', words: ['bị ốm đột xuất', 'đam mê bóng đá', 'rèn luyện sức khỏe', 'học hỏi năng khiếu', 'bồi dưỡng kỹ năng', 'mong được phê duyệt'] },
      { name: 'Hứa & Cảm ơn', words: ['chân thành cảm ơn', 'cam kết thực hiện đúng nội quy', 'chép bài đầy đủ', 'tự nguyện tham gia tích cực', 'kính đơn'] }
    ]
  },
  'ta-con-vat': {
    title: '🐱 Từ vựng Văn Tả Con Vật',
    categories: [
      { name: 'Ngoại hình lông mắt', words: ['bộ lông mượt mà', 'đôi mắt tròn xoe sáng quắc', 'cái đuôi ngoáy tít', 'bốn chân thoăn thoắt', 'tai vểnh nghe ngóng', 'oai vệ dũng mãnh'] },
      { name: 'Hoạt động nhanh nhẹn', words: ['nhảy xổ vào lòng', 'nũng nịu cọ đầu', 'rình rập bắt chuột', 'gáy vang báo thức', 'chạy nhảy đùa nghịch', 'vẫy đuôi mừng rỡ'] },
      { name: 'Tình thương chăm sóc', words: ['xem như thành viên gia đình', 'chăm sóc ân cần', 'cho ăn mỗi ngày', 'âu yếm vuốt ve', 'luôn bên cạnh bầu bạn'] }
    ]
  },
  'viet-huong-dan-bao-cao': {
    title: '📋 Từ vựng Viết hướng dẫn / Báo cáo',
    categories: [
      { name: 'Các bước quy trình', words: ['trước tiên cần chuẩn bị', 'bước đầu tiên', 'tiếp theo đó', 'bước cuối cùng là', 'đảm bảo an toàn', 'tiến hành khéo léo'] },
      { name: 'Họp nhóm phân công', words: ['tổ chức thảo luận nhóm', 'thống nhất ý kiến', 'phân công trách nhiệm', 'nhiệm vụ của tổ', 'bầu ra ban chủ nhiệm', 'đúng thời hạn'] },
      { name: 'Kết quả tổng kết', words: ['báo cáo kết quả', 'tổ 1 đã hoàn thành tốt', 'nhất trí thông qua', 'đạt hiệu quả cao', 'gắn kết tinh thần làm việc nhóm'] }
    ]
  }
};
