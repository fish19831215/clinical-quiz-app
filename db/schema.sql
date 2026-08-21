-- Interactive Clinical Quiz Database Schema
-- Compatible with PostgreSQL (Neon Serverless)

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Quizzes Table
CREATE TABLE IF NOT EXISTS quizzes (
    id INT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    total_scenes_per_quiz INT DEFAULT 3,
    total_score INT DEFAULT 100
);

-- 3. Scenes Table
CREATE TABLE IF NOT EXISTS scenes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id INT REFERENCES quizzes(id) ON DELETE CASCADE,
    scene_title VARCHAR(200) NOT NULL,
    scenario_description TEXT NOT NULL,
    media_type VARCHAR(50) DEFAULT 'image', -- 'video' or 'image'
    media_url TEXT -- Link to generated media (Veo/Gemini)
);

-- 4. Questions Table
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scene_id UUID REFERENCES scenes(id) ON DELETE CASCADE,
    sub_question_order INT NOT NULL,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL, -- Format: [{"id": "A", "text": "Option text"}, ...]
    correct_option VARCHAR(10) NOT NULL,
    explanation TEXT NOT NULL,
    points INT DEFAULT 10
);

-- 5. User Attempts Table
CREATE TABLE IF NOT EXISTS user_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    quiz_id INT REFERENCES quizzes(id) ON DELETE CASCADE,
    score INT NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. User Answers Table
CREATE TABLE IF NOT EXISTS user_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID REFERENCES user_attempts(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    selected_option VARCHAR(10) NOT NULL,
    is_correct BOOLEAN NOT NULL,
    score_earned INT NOT NULL,
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_users_staff_id ON users(staff_id);
CREATE INDEX IF NOT EXISTS idx_scenes_quiz_id ON scenes(quiz_id);
CREATE INDEX IF NOT EXISTS idx_questions_scene_id ON questions(scene_id);
CREATE INDEX IF NOT EXISTS idx_user_attempts_user_id ON user_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_attempt_id ON user_answers(attempt_id);


-- ==========================================
-- SEED DATA
-- ==========================================

-- Insert Quizzes
INSERT INTO quizzes (id, title, total_scenes_per_quiz, total_score) VALUES
(1, '心導管檢查之專業護理照護與結構化交班', 3, 100),
(2, '呼吸道感染與肺炎照護', 3, 100),
(3, '化學治療患者評估與照護', 3, 100)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, total_scenes_per_quiz = EXCLUDED.total_scenes_per_quiz;


-- ==========================================
-- QUIZ 1: 心導管檢查之專業護理照護與結構化交班 (Scenes and Questions)
-- ==========================================

-- Scene 1-A (橈動脈 Steap-T 壓迫板照護)
DO $$
DECLARE
    v_scene_id UUID;
BEGIN
    INSERT INTO scenes (quiz_id, scene_title, scenario_description, media_type, media_url)
    VALUES (
        1, 
        '橈動脈 Steap-T 壓迫板照護', 
        '林先生，62歲，上午接受診斷性橈動脈心導管檢查（CAG），術後使用單純 Steap-T 壓迫板加壓止血送回病房。護理同仁正在核對病人手腕處的包紮狀態，並對照末梢循環。', 
        'video', 
        'https://res.cloudinary.com/demo/video/upload/c_scale,w_480/clinical_radial_access.mp4'
    ) RETURNING id INTO v_scene_id;

    -- Q1-1
    INSERT INTO questions (scene_id, sub_question_order, question_text, options, correct_option, explanation, points)
    VALUES (
        v_scene_id,
        1,
        '林先生剛送回病房，護理人員執行首次評估時，關於本單位使用的「Steap-T 壓迫板」加壓照護要點，以下敘述何者錯誤？',
        '[
            {"id": "A", "text": "應隨時評估穿刺部位有無出血、局部滲血與硬塊血腫"},
            {"id": "B", "text": "需依照常規氣囊止血器流程，每隔 2 小時用氣囊針逐步放氣減壓"},
            {"id": "C", "text": "必須評估右手末梢血管循環的 6Ps（疼痛、蒼白、搏動、感覺、溫度、運動）"},
            {"id": "D", "text": "注意林先生是否同時有遠端橈動脈（鼻煙壺處）的第二個穿刺點，勿漏評估"}
        ]',
        'B',
        '本病房使用的是「單純 Steap-T 壓迫板」加壓，並非氣囊放氣式止血器，因此無須用氣囊針進行放氣操作。護理重點是檢查壓迫部位有無血腫或滲漏，並對照末梢 6Ps 循環。',
        10
    );

    -- Q1-2
    INSERT INTO questions (scene_id, sub_question_order, question_text, options, correct_option, explanation, points)
    VALUES (
        v_scene_id,
        2,
        '術後評估中，若發現林先生的橈動脈搏動摸不到，但由於尺動脈代償，手部仍然溫暖。此時最需要排除的危急併發症是？',
        '[
            {"id": "A", "text": "橈動脈閉塞 (RAO)"},
            {"id": "B", "text": "腹膜後出血 (RPH)"},
            {"id": "C", "text": "再灌流心律不整"},
            {"id": "D", "text": "造影劑過敏"}
        ]',
        'A',
        '橈動脈閉塞（RAO）發生率約 2-10%，若加壓過緊可能導致。此時橈動脈搏動消失，但因尺動脈有側支循環，手部膚溫仍可能正常，容易漏評，故術前必須落實 Allen''s test，術後需仔細比對搏動。',
        10
    );

    -- Q1-3
    INSERT INTO questions (scene_id, sub_question_order, question_text, options, correct_option, explanation, points)
    VALUES (
        v_scene_id,
        3,
        '林先生表示大拇指和食指出現刺痛麻木感（Paresthesia），且大拇指指甲微發紺。護理同仁最正確的第一步處置是？',
        '[
            {"id": "A", "text": "這屬於術後正常的神經壓迫，請病患多活動手指即可"},
            {"id": "B", "text": "立即完全拆除 Steap-T 壓迫板並重新以彈性繃帶固定"},
            {"id": "C", "text": "立即評估右手 6Ps 末梢血流，報告醫師，並確認壓迫板是否綁得過緊、阻礙動脈血流"},
            {"id": "D", "text": "給予熱敷以緩解大拇指的冰冷與發紺情況"}
        ]',
        'C',
        '麻木感（Paresthesia）與發紺屬於 6Ps 異常指標，代表末梢循環阻礙或壓迫板過緊。護理師應立即完成完整 6Ps 評估並通報醫師，絕不可在未確認止血狀態下自行拆除壓迫板，且嚴禁熱敷。',
        10
    );
END $$;


-- Scene 1-B (股動脈術後加壓與臥床限制)
DO $$
DECLARE
    v_scene_id UUID;
BEGIN
    INSERT INTO scenes (quiz_id, scene_title, scenario_description, media_type, media_url)
    VALUES (
        1, 
        '股動脈術後加壓與臥床限制', 
        '陳女士，70歲，因急性心肌梗塞（STEMI）接受股動脈穿刺進行 PCI 並置放支架。術後返回病房，股動脈已拔鞘，目前使用砂袋加壓，丁字褲固定，並嚴格限制平躺臥床。', 
        'image', 
        'https://res.cloudinary.com/demo/image/upload/c_scale,w_480/clinical_femoral_access.jpg'
    ) RETURNING id INTO v_scene_id;

    -- Q1-4
    INSERT INTO questions (scene_id, sub_question_order, question_text, options, correct_option, explanation, points)
    VALUES (
        v_scene_id,
        1,
        '陳女士返回病房 2 小時，表示完全平躺非常腰酸，家屬詢問護理師「可不可以把床頭搖高 30 度坐起來一下，或是讓她的右腳彎曲一下」？護理師最正確的衛教是？',
        '[
            {"id": "A", "text": "可以稍微抬高床頭 15-30 度，只要腳伸直即可"},
            {"id": "B", "text": "右腳可以微彎曲交互休息，砂袋不要掉下來就行"},
            {"id": "C", "text": "患側肢體（右下肢）必須絕對伸直且平躺臥床 8 小時。臥床期間不可彎曲、不可抬頭或用力咳嗽，避免血管封口撕裂大出血"},
            {"id": "D", "text": "可以讓病患側躺至健側（左側），只要右腳下墊枕頭即可"}
        ]',
        'C',
        '股動脈拔鞘加壓後，患側肢體必須伸直平躺臥床 8 小時（膝關節絕對不可彎曲、不可抬頭或用力咳嗽），否則股動脈的高壓血流會衝破封口導致大出血。翻身需維持患側伸直軸向翻身。',
        10
    );

    -- Q1-5
    INSERT INTO questions (scene_id, sub_question_order, question_text, options, correct_option, explanation, points)
    VALUES (
        v_scene_id,
        2,
        '術後第 4 小時，陳女士突然主訴「後背部與腰薦處非常劇烈酸痛」，掀開被子檢查，右鼠蹊部敷料完好無滲血，但生命徵象顯示血壓從 122/80 暴跌至 88/52 mmHg，心跳升至 108 次/分。此時最應懷疑的隱藏致命陷阱是？',
        '[
            {"id": "A", "text": "急性支架內血栓 (Stent Thrombosis)"},
            {"id": "B", "text": "腹膜後出血 (Retroperitoneal Hemorrhage, RPH)"},
            {"id": "C", "text": "正常平躺過久的肌肉酸痛"},
            {"id": "D", "text": "造影劑引起的腎衰竭酸痛"}
        ]',
        'B',
        '腹膜後出血（RPH）多發生於股動脈穿刺點偏高時，血液向後流入腹膜後腔室，外觀完全看不到血腫或滲血。其三大危急症狀為：1.突發劇烈腰酸背痛；2.原因不明的血壓暴跌與心跳加快；3.血紅素快速下降與休克。',
        10
    );

    -- Q1-6
    INSERT INTO questions (scene_id, sub_question_order, question_text, options, correct_option, explanation, points)
    VALUES (
        v_scene_id,
        3,
        '為了監測陳女士右下肢的末梢血流循環，護理師應評估哪個動脈搏動點，且觸診時的黃金原則為何？',
        '[
            {"id": "A", "text": "只需觸診右腳橈動脈即可"},
            {"id": "B", "text": "雙側對照觸診「足背動脈」，評估患側與健側的搏動強弱有無變弱或消失"},
            {"id": "C", "text": "觸診右側膕動脈搏動"},
            {"id": "D", "text": "看腳趾膚色是否紅潤，不需觸診動脈"}
        ]',
        'B',
        '評估股動脈術後下肢血流，必須「雙側對照觸診足背動脈」，比對患側搏動有無變弱或消失，以早期發現動脈栓塞或狹窄。',
        10
    );

    -- Q1-7
    INSERT INTO questions (scene_id, sub_question_order, question_text, options, correct_option, explanation, points)
    VALUES (
        v_scene_id,
        4,
        '陳女士術後已滿 6 小時仍未解尿，主訴下腹部脹痛、煩躁。此時護理師應採取的最適當步驟是？',
        '[
            {"id": "A", "text": "直接執行單次導尿，不需評估"},
            {"id": "B", "text": "評估下腹膀胱脹度，可給予溫水引導排尿或聽流水聲；若滿 6 小時仍無法排出，應遵醫囑單次導尿，避免膀胱過度膨脹導致血管反射性血壓下降"},
            {"id": "C", "text": "請病患忍耐到臥床 8 小時結束後，再下床解尿"},
            {"id": "D", "text": "立即打電話給醫師要求將砂袋與丁字褲拆除，方便病患用力排尿"}
        ]',
        'B',
        '術後 6 小時內必須解尿二次，排除排尿障礙。長期平躺與砂袋加壓易壓迫神經引起尿滯留，若膀胱過度脹大，會引發迷走神經反射導致血壓驟降。處理應先以物理引導，若仍無法解尿，則須行單次導尿，絕不可自行提早拆除壓迫。',
        10
    );
END $$;


-- Scene 1-C (用藥把關與造影劑過敏)
DO $$
DECLARE
    v_scene_id UUID;
BEGIN
    INSERT INTO scenes (quiz_id, scene_title, scenario_description, media_type, media_url)
    VALUES (
        1, 
        '用藥把關與造影劑過敏', 
        '張先生，65歲，患有第2型糖尿病與穩定型心絞痛，今日下午預定送心導管室進行冠狀動脈造影（CAG）。護理師正在進行病歷與藥物核對。', 
        'image', 
        'https://res.cloudinary.com/demo/image/upload/c_scale,w_480/clinical_chemo_nurse.jpg'
    ) RETURNING id INTO v_scene_id;

    -- Q1-8
    INSERT INTO questions (scene_id, sub_question_order, question_text, options, correct_option, explanation, points)
    VALUES (
        v_scene_id,
        1,
        '在核對張先生的口服藥物時，發現病患有服用 Metformin 500mg BID。護理師應執行的正確把關處置為何？',
        '[
            {"id": "A", "text": "手術當天早上照常給藥，術後再停用"},
            {"id": "B", "text": "心導管當天及術後 48 小時內必須暫停使用 Metformin，避免造影劑暫時性腎功能受損導致藥物蓄積，引發致命的乳酸中毒"},
            {"id": "C", "text": "只須在手術後停藥 12 小時，隔天即可恢復服用"},
            {"id": "D", "text": "Metformin 不受造影劑影響，不需停藥"}
        ]',
        'B',
        'Metformin 在體內主要由腎臟排泄。心導管造影劑會暫時影響腎臟功能，若不暫停 Metformin，藥物易在體內蓄積，進而引發高達 50% 死亡率的「乳酸中毒 (Lactic Acidosis)」，因此手術當天及術後 48 小時內必須停藥。',
        10
    );

    -- Q1-9
    INSERT INTO questions (scene_id, sub_question_order, question_text, options, correct_option, explanation, points)
    VALUES (
        v_scene_id,
        2,
        '張先生自訴吃螃蟹跟蝦子會皮膚癢，病歷上記錄對造影劑無過敏史。以下敘述何者正確？',
        '[
            {"id": "A", "text": "對海鮮過敏等同對造影劑過敏，必須立刻通報並停做手術"},
            {"id": "B", "text": "海鮮與貝類過敏在臨床上與造影劑過敏無必然因果關係，但代表高過敏體質，仍須提高警覺，若曾有造影劑輕中度過敏史者，應遵醫囑執行術前 13、7、1 小時的 Prednisone 口服類固醇預防處置"},
            {"id": "C", "text": "不需理會，對海鮮過敏與任何醫療過敏無關"},
            {"id": "D", "text": "直接在送導管室前 5 分鐘靜脈注射一劑類固醇即可替代所有預防措施"}
        ]',
        'B',
        '海鮮/貝類過敏與造影劑過敏不同，但屬於高敏族群。針對已知對造影劑過敏者，標準預防方案是術前 13、7、1 小時口服 Prednisone 50 mg，而非急診臨時注射，除非是緊急手術。',
        10
    );

    -- Q1-10
    INSERT INTO questions (scene_id, sub_question_order, question_text, options, correct_option, explanation, points)
    VALUES (
        v_scene_id,
        3,
        '張先生導管術後返回病房，已開立雙重抗血小板藥物（Bokey 搭配 Plavix）QD 口服。護理同仁在給藥與衛教時，應對病患強調哪項關鍵？',
        '[
            {"id": "A", "text": "如果覺得胃不舒服，可以先自己停藥幾天"},
            {"id": "B", "text": "只要血壓正常，這些藥物就可以減量"},
            {"id": "C", "text": "雙重抗血小板藥物（DAPT）絕對不可自行停藥！DES 支架患者若停藥，支架內急性血栓致死率高於 30%。後續有拔牙或手術需求必須回診評估"},
            {"id": "D", "text": "這個藥主要是降血壓的，要按時吃"}
        ]',
        'C',
        'DAPT 是置放支架（特別是塗藥支架 DES）病患預防支架內急性血栓的核心藥物。患者自行停藥會導致急性的支架內血栓，致死率高於 30%，因此必須進行嚴格服藥衛教。',
        10
    );
END $$;


-- ==========================================
-- QUIZ 2: 呼吸道感染與肺炎照護 (Scenes and Questions)
-- ==========================================

-- Scene 2-A (吸入性肺炎入院與 qSOFA 評估)
DO $$
DECLARE
    v_scene_id UUID;
BEGIN
    INSERT INTO scenes (quiz_id, scene_title, scenario_description, media_type, media_url)
    VALUES (
        2, 
        '吸入性肺炎入院與 qSOFA 評估', 
        '林爺爺，82歲，患有高血壓與中風後遺症，長期留置鼻胃管（NG tube）灌食。今日因發燒、劇烈咳嗽、自咳能力差、痰液黏稠由安養中心送入病房。胸部 X 光顯示右下肺葉有明顯的浸潤陰影。', 
        'image', 
        'https://res.cloudinary.com/demo/image/upload/c_scale,w_480/clinical_pneumonia_xray.jpg'
    ) RETURNING id INTO v_scene_id;

    -- Q2-1
    INSERT INTO questions (scene_id, sub_question_order, question_text, options, correct_option, explanation, points)
    VALUES (
        v_scene_id,
        1,
        '林爺爺的 X 光顯示浸潤集中在「右下肺葉」，且他是留置鼻胃管的中風病患。從病生理學來看，這最可能屬於何種肺炎，且為何好發於此部位？',
        '[
            {"id": "A", "text": "社區型肺炎 (CAP)，因為右下肺通氣量最大"},
            {"id": "B", "text": "醫院型肺炎 (HAP)，因為住院後交叉感染"},
            {"id": "C", "text": "吸入性肺炎 (Aspiration Pneumonia)。因為右側主支氣管較為陡直且粗短，口咽分泌物或胃內容物嗆入時，極易順著解剖角度掉入右下肺葉"},
            {"id": "D", "text": "非典型肺炎，與鼻胃管無關"}
        ]',
        'C',
        '吸入性肺炎好發於右下肺葉，主因是解剖學上右側主支氣管與氣管夾角較小（角度直而陡），且口咽厭氧菌常隨微量吸入進入此處，尤其見於有吞嚥障礙或留置 NG tube 之病患。',
        10
    );

    -- Q2-2
    INSERT INTO questions (scene_id, sub_question_order, question_text, options, correct_option, explanation, points)
    VALUES (
        v_scene_id,
        2,
        '林爺爺入院首次評估，量測生命徵象為：呼吸速率 24 次/分，血壓 98/60 mmHg，且呈現新發意識混亂、嗜睡。依據臨床「qSOFA」評分，林爺爺的分數與臨床處置為何？',
        '[
            {"id": "A", "text": "1 分，在病房觀察即可，不需特別通報"},
            {"id": "B", "text": "2 分，只符合血壓與意識，仍屬低風險"},
            {"id": "C", "text": "3 分（呼吸速率≥22、收縮壓≤100、意識狀態改變均符合）。代表高死亡與重症風險之敗血症紅旗，應立即通報並準備大流量補液、抽血培養與經驗性抗生素"},
            {"id": "D", "text": "0 分，生命徵象尚屬穩定"}
        ]',
        'C',
        'qSOFA 快速評估指標：1.呼吸速率≥22次/分；2.收縮壓≤100 mmHg；3.意識狀態改變。符合≥2項即代表重症與敗血症高度良後風險，必須立即通報並啟動大流量補液與感控篩檢。',
        10
    );

    -- Q2-3
    INSERT INTO questions (scene_id, sub_question_order, question_text, options, correct_option, explanation, points)
    VALUES (
        v_scene_id,
        3,
        '林爺爺的痰培養報告回報為 MRSA（多重抗藥性金黃色葡萄球菌）陽性。護理師此時最正確的感控隔離處置為何？',
        '[
            {"id": "A", "text": "飛沫隔離，進出房戴 N95 即可，不需限制接觸"},
            {"id": "B", "text": "空氣隔離，必須立即移至負壓隔離病房"},
            {"id": "C", "text": "接觸隔離。在房門張貼接觸隔離標示，進出病房需落實手部衛生、穿防護衣與戴手套，且聽診器等物品需專用消毒"},
            {"id": "D", "text": "不需隔離，照常進行常規照護"}
        ]',
        'C',
        'MRSA 屬於多重抗藥菌，必須落實「接觸隔離 (Contact Isolation)」以防範院內傳播。重點包括張貼標示、手部衛生、防護套衣與儀器專人專用。',
        10
    );
END $$;


-- Scene 2-B (缺氧惡化與給氧設備升階)
DO $$
DECLARE
    v_scene_id UUID;
BEGIN
    INSERT INTO scenes (quiz_id, scene_title, scenario_description, media_type, media_url)
    VALUES (
        2, 
        '缺氧惡化與給氧設備升階', 
        '林爺爺在病房內呼吸急促加劇，在鼻導管 3 L/min 吸氧下，SpO2 仍持續掉至 90%，呼吸速率達 32 次/分，說話因喘而無法說完完整句子。', 
        'video', 
        'https://res.cloudinary.com/demo/video/upload/c_scale,w_480/clinical_oxygen_therapy.mp4'
    ) RETURNING id INTO v_scene_id;

    -- Q2-4
    INSERT INTO questions (scene_id, sub_question_order, question_text, options, correct_option, explanation, points)
    VALUES (
        v_scene_id,
        1,
        '醫師指示將林爺爺的給氧設備調整為「簡單面罩 (Simple Mask)」。此時護理師設定氧氣流速時，最關鍵的安全底線為何？',
        '[
            {"id": "A", "text": "流速應設定為 2-3 L/min 以節省氧氣"},
            {"id": "B", "text": "流速絕對不可低於 5 L/min（通常設定 5-10 L/min），以防病患呼出的二氧化碳在面罩內蓄積並被重複吸入"},
            {"id": "C", "text": "流速越高越好，直接開到最大 15 L/min"},
            {"id": "D", "text": "簡單面罩不需要接流速表，直接掛上即可"}
        ]',
        'B',
        '簡單面罩流速不可低於 5 L/min，這是為了產生足夠的衝刷流量，將患者呼出的 CO2 帶走，防範 CO2 滯留。常見設定為 5-10 L/min (提供 40-60% FiO2)。',
        10
    );

    -- Q2-5
    INSERT INTO questions (scene_id, sub_question_order, question_text, options, correct_option, explanation, points)
    VALUES (
        v_scene_id,
        2,
        '改用面罩後抽動脈血氣分析（ABG）報告顯示：PaO2 55 mmHg，PaCO2 38 mmHg。當時氧氣設定為 40% (FiO2 0.4)。此時林爺爺的呼吸衰竭類型與氧合指數（PaO2/FiO2）各為何？',
        '[
            {"id": "A", "text": "第二型呼吸衰竭；氧合指數為 200"},
            {"id": "B", "text": "第一型（缺氧性）呼吸衰竭；氧合指數為 137.5 mmHg（代表中度 ARDS 範圍）"},
            {"id": "C", "text": "第一型呼吸衰竭；氧合指數為 350 mmHg"},
            {"id": "D", "text": "正常血氧狀態；氧合指數正常"}
        ]',
        'B',
        '第一型（Hypoxemic）呼吸衰竭定義為 PaO2 < 60 mmHg 且 PaCO2 正常或偏低。氧合指數為 55 / 0.4 = 137.5 mmHg，小於 200 代表已進展至中度急性呼吸窘迫症候群（ARDS），一般面罩氧療通常無反應，需準備 NIV 或插管。',
        10
    );

    -- Q2-6
    INSERT INTO questions (scene_id, sub_question_order, question_text, options, correct_option, explanation, points)
    VALUES (
        v_scene_id,
        3,
        '由於林爺爺痰液黏稠自咳差，護理師為其執行抽痰（Suction）。抽痰過程中，林爺爺的 SpO2 突然掉到 85%，且心電圖顯示心跳從 86 驟降至 48 次/分。最可能的成因與首要處置是？',
        '[
            {"id": "A", "text": "因為抽痰清除了氣道，心跳變慢是放鬆的正常生理現象"},
            {"id": "B", "text": "為迷走神經刺激引起的心搏過緩與缺氧。應立即停抽、拔出管路，給予 100% 氧氣輔助"},
            {"id": "C", "text": "代表痰液仍未抽乾淨，應加快抽吸速度並維持壓力 200 mmHg"},
            {"id": "D", "text": "立即執行心肺復甦術 (CPR)，不需要給氧"}
        ]',
        'B',
        '抽痰時間過長或壓力過大，容易刺激氣管黏膜的迷走神經引起反射性「心搏過緩（Bradycardia）」與嚴重缺氧。首要步驟是立即停止抽吸、給予 100% 高濃度氧氣。',
        10
    );
END $$;


-- Scene 2-C (排痰與鼻胃管防吸入照護 SOP)
DO $$
DECLARE
    v_scene_id UUID;
BEGIN
    INSERT INTO scenes (quiz_id, scene_title, scenario_description, media_type, media_url)
    VALUES (
        2, 
        '排痰與鼻胃管防吸入照護 SOP', 
        '林爺爺目前呼吸平順，痰液仍多但較黏稠。護理同仁計畫執行胸腔叩擊（拍痰）與姿態引流，並安排下一次的鼻胃管管灌配方奶。', 
        'video', 
        'https://res.cloudinary.com/demo/video/upload/c_scale,w_480/clinical_ng_feeding.mp4'
    ) RETURNING id INTO v_scene_id;

    -- Q2-7
    INSERT INTO questions (scene_id, sub_question_order, question_text, options, correct_option, explanation, points)
    VALUES (
        v_scene_id,
        1,
        '關於林爺爺的排痰 4 大技術處置順序與時間限制，以下何者正確？',
        '[
            {"id": "A", "text": "先抽痰 → 再拍痰 → 然後給予霧化吸入鬆痰"},
            {"id": "B", "text": "應先給予霧化吸入（鬆痰）→ 進行胸腔叩擊（拍痰）與姿態引流 → 最後行抽痰清除氣道；且拍痰須在餵食前 1 小時或餵食後 2 小時進行"},
            {"id": "C", "text": "灌食完立刻進行拍痰與姿態引流引導，效果最好"},
            {"id": "D", "text": "拍痰時手掌平貼用力拍打脊椎骨及雙側腎臟部位"}
        ]',
        'B',
        '排痰黃金順序為：先做霧化（稀釋老痰）→ 拍痰與引流（將痰液引流至大氣管）→ 抽痰（清除）。且拍痰必須在餵食前 1 小時或餵食後 2 小時外，避免引發胃食道逆流導致吸入。叩擊應避開脊椎與腎區。',
        10
    );

    -- Q2-8
    INSERT INTO questions (scene_id, sub_question_order, question_text, options, correct_option, explanation, points)
    VALUES (
        v_scene_id,
        2,
        '灌食前，護理師核對林爺爺的鼻胃管刻度。發現與置留記錄（55 cm）相比，鼻翼刻度顯示滑脫至 60 cm，且回抽無物。此時護理師應如何抉擇？',
        '[
            {"id": "A", "text": "既然抽不出胃殘餘量，代表消化良好，可以直接灌食"},
            {"id": "B", "text": "將管路稍微往內推回 55 cm 後直接灌食"},
            {"id": "C", "text": "暫停灌食，並回抽胃液測試 pH 是否 ≦ 5.5，若仍有疑慮應請醫師照 X-ray 確認管路位置，防範管路滑脫至氣管導致吸入性窒息"},
            {"id": "D", "text": "直接灌入 50 mL 溫水測試病人有沒有咳嗽，沒有就可以灌食"}
        ]',
        'C',
        '鼻胃管刻度移位代表管路有滑脫風險，抽不出胃液有可能是管路掉入氣道或食道。絕對不可進行灌食，需以 pH 試紙測試（≦5.5 代表胃酸）或照 X 光確認，否則易造成致命的吸入性窒息。',
        10
    );

    -- Q2-9
    INSERT INTO questions (scene_id, sub_question_order, question_text, options, correct_option, explanation, points)
    VALUES (
        v_scene_id,
        2,
        '在林爺爺進行鼻胃管灌食期間與灌食後，為了有效預防胃食道逆流及微吸入，病房護理 SOP 規定的體位管理與配合措施為何？',
        '[
            {"id": "A", "text": "灌食中抬高床頭，灌食完即可立刻平躺休息"},
            {"id": "B", "text": "灌食前、中及灌食後 30-60 分鐘，床頭需抬高至少 30°-45°（HOB），且灌食前後 1 小時內避免拍痰、引流或抽痰"},
            {"id": "C", "text": "灌食全程讓病人採取左側臥位即可"},
            {"id": "D", "text": "只要病患沒有嗆咳，平躺或坐著灌食皆可"}
        ]',
        'B',
        '防吸入擺位 SOP要求灌食全程及灌食後維持 HOB 30-45° 至少 30-60 分鐘。且為防食物倒流，灌食前後 1 小時內禁忌拍痰或抽痰。',
        10
    );

    -- Q2-10
    INSERT INTO questions (scene_id, sub_question_order, question_text, options, correct_option, explanation, points)
    VALUES (
        v_scene_id,
        4,
        '灌食到一半，林爺爺突然雙眼圓睜、面色發紺，口鼻噴出黃褐色牛奶，SpO2 暴跌至 82%。護理人員最正確的「黃金第一秒」處置是？',
        '[
            {"id": "A", "text": "立即打電話叫住院醫師來看，不需觸碰管路"},
            {"id": "B", "text": "立即「停止灌食」、抬高床頭、立刻拿抽痰管吸引（Suction）口鼻及氣道殘餘物，並給予高濃度氧氣"},
            {"id": "C", "text": "加快速度把剩下的配方奶灌完，再幫病人拍背"},
            {"id": "D", "text": "幫病人翻身俯臥，床尾抬高 30 度"}
        ]',
        'B',
        '管灌中突發嗆咳或吸入是緊急紅旗，首要「黃金時間」處置是：立即停灌、搖高床頭防進一步倒流、迅速吸引氣道清除吸入物，並給予高濃度氧氣，絕不可等醫師來才做。',
        10
    );
END $$;


-- ==========================================
-- QUIZ 3: 化學治療患者評估與照護 (Scenes and Questions)
-- ==========================================

-- Scene 3-A (給藥前安全准入與血管通路)
DO $$
DECLARE
    v_scene_id UUID;
BEGIN
    INSERT INTO scenes (quiz_id, scene_title, scenario_description, media_type, media_url)
    VALUES (
        3, 
        '給藥前安全准入與血管通路', 
        '劉女士，55歲，乳癌，今日入住病房預計施打 FOLFOX 方案（含發泡性化療藥物），左上臂留置 PICC 導管。護理師正在進行給藥前的安全核對。', 
        'image', 
        'https://res.cloudinary.com/demo/image/upload/c_scale,w_480/clinical_picc_line.jpg'
    ) RETURNING id INTO v_scene_id;

    -- Q3-1
    INSERT INTO questions (scene_id, sub_question_order, question_text, options, correct_option, explanation, points)
    VALUES (
        v_scene_id,
        1,
        '劉女士今日抽血報告為：白血球 (WBC) 3,000/μL，Seg 46%，Band 2%，血小板 (Plt) 12 萬。計算劉女士今日的 ANC（嗜中性白血球值），並評估是否能執行化療？',
        '[
            {"id": "A", "text": "ANC 為 1,440/μL。已低於常規給藥門檻 1,500/μL，應暫停化療給藥，通報主治醫師評估是否減量或延期"},
            {"id": "B", "text": "ANC 為 1,380/μL。可以正常施打，不需通報"},
            {"id": "C", "text": "ANC 為 3,000/μL。完全正常，可以施打"},
            {"id": "D", "text": "ANC 不受 Seg 影響，只看血小板 12 萬即可施打"}
        ]',
        'A',
        'ANC 計算公式：WBC × (Seg% + Band%)。劉女士的 ANC = 3,000 × (46% + 2%) = 1,440/μL。低於化療安全准入標準（ANC ≥ 1,500/μL），屬於中度骨髓抑制風險，應暫停給藥並請示醫師。',
        10
    );

    -- Q3-2
    INSERT INTO questions (scene_id, sub_question_order, question_text, options, correct_option, explanation, points)
    VALUES (
        v_scene_id,
        2,
        '護理師在評估劉女士的左上臂 PICC 導管通路時，發現局部無紅腫熱痛，推注生理食鹽水時感覺無阻力，但抽吸時「無回血」。此時最安全的護理抉策是？',
        '[
            {"id": "A", "text": "既然推注水無阻力，代表管路在血管內，可以直接開始滴注化療藥物"},
            {"id": "B", "text": "遵循「不見回血，不打化療」安全規範。暫停給藥，通報醫師，可遵醫囑照 X-ray 或使用血栓溶解劑處理，防範藥物外滲"},
            {"id": "C", "text": "改由周邊靜脈直接打一針留置針來施打發泡性化療藥"},
            {"id": "D", "text": "請病患用力抓握手部，直到管路順暢，再直接施打"}
        ]',
        'B',
        '腫瘤科安全原則：不見回血，不打化療。PICC 無回血代表可能有導管尖端纖維鞘形成或移位，若強行注射發泡性化療藥極易外滲導致局部組織壞死。',
        10
    );

    -- Q3-3
    INSERT INTO questions (scene_id, sub_question_order, question_text, options, correct_option, explanation, points)
    VALUES (
        v_scene_id,
        3,
        '兩位護理師在病房為劉女士進行「雙人床邊核對 (Double Check)」，除了核對手圈姓名、藥名、劑量之外，哪一項也是極易被忽視但必須現場核對的關鍵點？',
        '[
            {"id": "A", "text": "化療同意書的影印品質"},
            {"id": "B", "text": "輸液幫浦 (Pump) 面板上設定的「滴注流速與總輸入量」是否與醫囑完全一致"},
            {"id": "C", "text": "病患的手機有沒有關機"},
            {"id": "D", "text": "當天藥局送藥人員的姓名"}
        ]',
        'B',
        '化療給藥錯誤中，幫浦面板設定錯誤（流速、小數點位移）常導致藥物過速輸入中毒。雙人核對必須包括「面板設定的核對與確認」。',
        10
    );
END $$;


-- Scene 3-B (給藥順序與副作用管理)
DO $$
DECLARE
    v_scene_id UUID;
BEGIN
    INSERT INTO scenes (quiz_id, scene_title, scenario_description, media_type, media_url)
    VALUES (
        3, 
        '給藥順序與副作用管理', 
        '劉女士的血管通路與報告經確認無誤，化療方案正式開始。醫囑包含發泡性藥物 Doxorubicin、刺激性藥物 Oxaliplatin 與口服前用藥。', 
        'video', 
        'https://res.cloudinary.com/demo/video/upload/c_scale,w_480/clinical_chemo_infusion.mp4'
    ) RETURNING id INTO v_scene_id;

    -- Q3-4
    INSERT INTO questions (scene_id, sub_question_order, question_text, options, correct_option, explanation, points)
    VALUES (
        v_scene_id,
        1,
        '關於化療滴注順序與前用藥管理，以下哪項處置最為妥當？',
        '[
            {"id": "A", "text": "前用藥（止吐劑）應在化療主藥滴注前 30 分鐘給予；多種化療藥物連續滴注時，發泡性（Vesicant）藥物應優先滴注"},
            {"id": "B", "text": "前用藥隨時打都可以，化療滴完再補打也可以"},
            {"id": "C", "text": "刺激性藥物排在最前頭，發泡性留到最後血管疲乏時再打"},
            {"id": "D", "text": "發泡性藥物滴完後，直接接上下一包化療，不需用生理食鹽水沖管"}
        ]',
        'A',
        '前用藥應在化療前 30 分鐘按時給予，使藥效在化療開始時達到波峰。發泡性藥物（如 Doxorubicin）外滲風險大，應優先滴注（此時血管狀態最好、容易評估回血），且每種藥物之間必須用 N/S 沖管。',
        10
    );

    -- Q3-5
    INSERT INTO questions (scene_id, sub_question_order, question_text, options, correct_option, explanation, points)
    VALUES (
        v_scene_id,
        2,
        '劉女士正在滴注 Oxaliplatin，表示手指有麻木感，家屬打算拿保溫杯裝冰水給劉女士喝以緩解麻木。護理師應如何給予關鍵指導？',
        '[
            {"id": "A", "text": "喝冰水可以降低末梢敏感，是正確的方法"},
            {"id": "B", "text": "Oxaliplatin 會引起嚴重的「急性冷敏感反應」。必須指導病人絕對避免接觸冷物或飲用冷水/冷飲，避免引發喉頭緊縮感與肢體劇烈麻痛"},
            {"id": "C", "text": "這是藥物外滲，應立即冰敷"},
            {"id": "D", "text": "發麻代表藥物吸收良好，不需做任何調整"}
        ]',
        'B',
        'Oxaliplatin 特有的周邊神經毒性會導致急性冷敏感（Cold Sensitivity）。患者吸入冷空氣或飲用冰水，會誘發嚴重的喉部緊縮感及手指針刺麻痛，因此必須實施避冷衛教（使用溫水、戴口罩/手套）。',
        10
    );

    -- Q3-6
    INSERT INTO questions (scene_id, sub_question_order, question_text, options, correct_option, explanation, points)
    VALUES (
        v_scene_id,
        3,
        '化療後第 7 天，劉女士血球低下，血小板報告為 18,000/μL。此時護理師應啟動何種活動限制，並衛教防範何種出血危急症？',
        '[
            {"id": "A", "text": "血小板正常，不需限制活動"},
            {"id": "B", "text": "指示患者「絕對臥床」，動作宜緩慢，預防便秘（給予軟便劑），避免憋氣用力導致致命的自發性顱內（腦）出血"},
            {"id": "C", "text": "請病患下床多做跑步、爬樓梯等運動，以促進骨髓造血"},
            {"id": "D", "text": "可以照常活動，但刷牙改用硬毛牙刷，才能清潔乾淨"}
        ]',
        'B',
        '血小板小於 20,000/μL 屬於極高自發性出血危險。病患必須絕對臥床，避免任何碰撞。用力排便會使顱內壓上升，誘發致命的自發性腦出血，故需預防便秘。禁用硬毛牙刷，改用超軟毛。',
        10
    );
END $$;


-- Scene 3-C (化療致命紅旗與處置)
DO $$
DECLARE
    v_scene_id UUID;
BEGIN
    INSERT INTO scenes (quiz_id, scene_title, scenario_description, media_type, media_url)
    VALUES (
        3, 
        '化療致命紅旗與處置', 
        '劉女士住院期間出現急性病況惡化或用藥後異常症狀。護理同仁必須針對臨床紅旗進行即時處置。', 
        'video', 
        'https://res.cloudinary.com/demo/video/upload/c_scale,w_480/clinical_chemo_extravasation.mp4'
    ) RETURNING id INTO v_scene_id;

    -- Q3-7
    INSERT INTO questions (scene_id, sub_question_order, question_text, options, correct_option, explanation, points)
    VALUES (
        v_scene_id,
        1,
        '劉女士體溫突升至 38.3°C，最新抽血顯示 ANC 800/μL。這符合何種臨床腫瘤危急急症？護理師應在多少時間內完成血液培養與第一劑抗生素？',
        '[
            {"id": "A", "text": "屬於一般感冒；應在 24 小時內給予感冒藥即可"},
            {"id": "B", "text": "腫瘤內科急症「發燒性嗜中性白血球低下 (Febrile Neutropenia, FN)」。必須在「發燒黃金 1 小時內」抽完雙套血培養（PICC與周邊各一套）並完成第一劑廣效抗生素滴注"},
            {"id": "C", "text": "屬於腫瘤溶解症候群；應給予降尿酸藥物"},
            {"id": "D", "text": "化療藥物正常的全身發炎反應，不需使用抗生素"}
        ]',
        'B',
        '發燒性嗜中性白血球低下 (FN) 定義為體溫≥38.0°C 且 ANC<1,000/μL。這是腫瘤科的醫療急症，患者可在數小時內死於敗血性休克。核心處置是「黃金 1 小時內」完成雙套血培養並接上第一劑抗生素滴注。',
        10
    );

    -- Q3-8
    INSERT INTO questions (scene_id, sub_question_order, question_text, options, correct_option, explanation, points)
    VALUES (
        v_scene_id,
        2,
        '劉女士在滴注 Doxorubicin 時，穿刺點突發局部劇烈發紅、灼痛、腫脹且回抽無回血。懷疑化療藥物外滲。護理師此時的「首要處置」應為何？',
        '[
            {"id": "A", "text": "立刻拔出 PICC 針頭，用力擠壓發紅部位將藥水擠出"},
            {"id": "B", "text": "立即停止點滴，但「保留針頭不要拔除」，接空針回抽殘餘化療藥物與血液（至少回抽 3-5 mL），隨後通知醫師"},
            {"id": "C", "text": "不需停藥，直接將點滴流速調慢，繼續滴完"},
            {"id": "D", "text": "立刻局部熱敷，促進藥物稀釋"}
        ]',
        'B',
        '化療外滲處置第一步是立即停藥，但切記「不要拔針」。利用原針頭接空針回抽皮下殘留藥物能顯著降低組織壞死程度。回抽後才可拔針、畫圈標記範圍並評估下一步。',
        10
    );

    -- Q3-9
    INSERT INTO questions (scene_id, sub_question_order, question_text, options, correct_option, explanation, points)
    VALUES (
        v_scene_id,
        3,
        '承上題，劉女士外滲的藥物為 Doxorubicin（蒽環類發泡性化療藥物）。在回抽並拔針後，護理師應給予何種局部物理治療？',
        '[
            {"id": "A", "text": "局部冷敷，使血管收縮、減緩藥物擴散，冷敷 15-20 min qid"},
            {"id": "B", "text": "局部熱敷，促進藥物稀釋與吸收"},
            {"id": "C", "text": "不需要冷敷或熱敷，只需局部塗抹乳液"},
            {"id": "D", "text": "局部用力按摩 15 分鐘，將紅腫按消"}
        ]',
        'A',
        '蒽環類發泡性藥物（如 Doxorubicin 小紅莓）外滲，標準處置是局部「冷敷」，使血管收縮，限制藥物對周邊組織的擴散。相反，植物鹼類（如 Vincristine）外滲則需「熱敷」促進吸收。外滲部位嚴禁按摩。',
        10
    );

    -- Q3-10
    INSERT INTO questions (scene_id, sub_question_order, question_text, options, correct_option, explanation, points)
    VALUES (
        v_scene_id,
        4,
        '若高腫瘤負荷癌症患者化療後，抽血報告呈現「高血鉀、高血磷、高尿酸、低血鈣」之危急值。此時護理師應立即配合醫師進行的照護為何？',
        '[
            {"id": "A", "text": "限制病患喝水，實施嚴格限水"},
            {"id": "B", "text": "腫瘤溶解症候群 (TLS)。應給予大量靜脈輸液強力水化（Hydration），維持每小時尿量在 150-200 mL 以上，加速尿酸與鉀離子排出，並給予心電圖監測"},
            {"id": "C", "text": "請病患多吃含鉀高的香蕉與柳丁，補充血鈣"},
            {"id": "D", "text": "此為正常骨髓造血現象，不需處置"}
        ]',
        'B',
        '腫瘤溶解症候群（TLS）會因細胞崩解釋放大量鉀、磷、尿酸，易引發急性腎衰竭與高鉀引起的心律不整。核心護理是「強力水化（Hydration）」，促使尿量達到 150-200 mL/h 以上排出毒素，並以 EKG 監測心律。',
        10
    );
END $$;
