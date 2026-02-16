-- =============================================
-- 심쿵게이지 (Gauge) 테이블 생성
-- =============================================

-- product_type=3 등록
INSERT INTO tm_flag (table_name, flag_code, flag_desc) VALUES
('tm_apply', '3', 'Gauge (심쿵게이지)');

-- 게이지 방
CREATE TABLE tm_gauge_room (
    room_seq SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    status VARCHAR(10) DEFAULT 'WAIT',
    table_count INTEGER DEFAULT 3,
    current_step VARCHAR(30) DEFAULT 'LOBBY',
    created_by INTEGER REFERENCES tm_user(user_seq),
    cre_dtime TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 게이지 참여자
CREATE TABLE tm_gauge_member (
    member_seq SERIAL PRIMARY KEY,
    room_seq INTEGER NOT NULL REFERENCES tm_gauge_room(room_seq),
    user_seq INTEGER NOT NULL REFERENCES tm_user(user_seq),
    name VARCHAR(100),
    gender VARCHAR(10),
    nickname VARCHAR(100),
    table_no INTEGER,
    status VARCHAR(10) DEFAULT 'JOINED',
    cre_dtime TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 상태 코드 등록
INSERT INTO tm_flag (table_name, flag_code, flag_desc) VALUES
('tm_gauge_room', 'WAIT', '대기중 (입장 가능)'),
('tm_gauge_room', 'PLAYING', '진행중'),
('tm_gauge_room', 'CLOSED', '종료됨'),
('tm_gauge_member', 'JOINED', '참여중'),
('tm_gauge_member', 'KICKED', '거절됨');

-- current_step 값 (게임 진행 단계):
-- LOBBY -> TABLE_SELECT -> NAMING_IMAGE -> NICKNAME
-- -> GAME1_1 -> GAME1_2 -> TALK1 -> HIDDEN1
-- -> GAME2_1 -> GAME2_2 -> GAME2_3 -> TALK2 -> HIDDEN2
-- -> GAME3_1 -> GAME3_2 -> GAME3_3 -> GAME3_4 -> TALK3 -> HIDDEN3
-- -> FINAL1 -> FINAL2 -> FINAL3 -> FINAL4 -> CLOSED

-- =============================================
-- 게임 데이터 테이블 (v2)
-- =============================================

-- 질문 답변 (GAME1_1)
CREATE TABLE IF NOT EXISTS tm_gauge_answer (
    answer_seq SERIAL PRIMARY KEY,
    room_seq INTEGER NOT NULL REFERENCES tm_gauge_room(room_seq),
    member_seq INTEGER NOT NULL REFERENCES tm_gauge_member(member_seq),
    question_no INTEGER NOT NULL,
    answer_text TEXT NOT NULL,
    cre_dtime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(room_seq, member_seq, question_no)
);

-- 게이지 점수 (GAME1_2, GAME2_3, GAME3_4 등)
CREATE TABLE IF NOT EXISTS tm_gauge_score (
    score_seq SERIAL PRIMARY KEY,
    room_seq INTEGER NOT NULL REFERENCES tm_gauge_room(room_seq),
    from_member_seq INTEGER NOT NULL REFERENCES tm_gauge_member(member_seq),
    to_answer_seq INTEGER REFERENCES tm_gauge_answer(answer_seq),
    to_member_seq INTEGER REFERENCES tm_gauge_member(member_seq),
    gauge_amount INTEGER NOT NULL DEFAULT 0,
    game_step VARCHAR(30) NOT NULL,
    cre_dtime TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 히든 게이징 선택 (HIDDEN1, HIDDEN2, HIDDEN3)
CREATE TABLE IF NOT EXISTS tm_gauge_hidden (
    hidden_seq SERIAL PRIMARY KEY,
    room_seq INTEGER NOT NULL REFERENCES tm_gauge_room(room_seq),
    from_member_seq INTEGER NOT NULL REFERENCES tm_gauge_member(member_seq),
    to_member_seq INTEGER REFERENCES tm_gauge_member(member_seq),
    game_step VARCHAR(30) DEFAULT 'HIDDEN1',
    cre_dtime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(room_seq, from_member_seq, game_step)
);

-- 메세지 (FINAL3)
CREATE TABLE IF NOT EXISTS tm_gauge_message (
    message_seq SERIAL PRIMARY KEY,
    room_seq INTEGER NOT NULL REFERENCES tm_gauge_room(room_seq),
    from_member_seq INTEGER NOT NULL REFERENCES tm_gauge_member(member_seq),
    to_member_seq INTEGER REFERENCES tm_gauge_member(member_seq),
    message_text TEXT,
    cre_dtime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(room_seq, from_member_seq)
);

-- 2차 참석 여부 (FINAL4)
CREATE TABLE IF NOT EXISTS tm_gauge_attendance (
    attendance_seq SERIAL PRIMARY KEY,
    room_seq INTEGER NOT NULL REFERENCES tm_gauge_room(room_seq),
    member_seq INTEGER NOT NULL REFERENCES tm_gauge_member(member_seq),
    is_attend INTEGER NOT NULL DEFAULT 0,
    cre_dtime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(room_seq, member_seq)
);

-- =============================================
-- 라이어 게임 (GAME2_1)
-- =============================================
CREATE TABLE IF NOT EXISTS tm_gauge_liar (
    liar_seq SERIAL PRIMARY KEY,
    room_seq INTEGER NOT NULL REFERENCES tm_gauge_room(room_seq),
    table_no INTEGER NOT NULL,
    liar_member_seq INTEGER NOT NULL REFERENCES tm_gauge_member(member_seq),
    nickname_for_liar VARCHAR(100) NOT NULL,
    nickname_for_others VARCHAR(100) NOT NULL,
    gender_pool VARCHAR(10) NOT NULL,
    round INTEGER DEFAULT 1,
    cre_dtime TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 기존 테이블 변경 (2/14 update)
-- =============================================
-- tm_gauge_score: to_member_seq 추가, to_answer_seq nullable
ALTER TABLE tm_gauge_score ADD COLUMN IF NOT EXISTS to_member_seq INTEGER REFERENCES tm_gauge_member(member_seq);
ALTER TABLE tm_gauge_score ALTER COLUMN to_answer_seq DROP NOT NULL;

-- tm_gauge_hidden: to_member_seq nullable, game_step 추가
ALTER TABLE tm_gauge_hidden ALTER COLUMN to_member_seq DROP NOT NULL;
ALTER TABLE tm_gauge_hidden ADD COLUMN IF NOT EXISTS game_step VARCHAR(30) DEFAULT 'HIDDEN1';
-- UNIQUE 제약 변경: (room_seq, from_member_seq) → (room_seq, from_member_seq, game_step)
ALTER TABLE tm_gauge_hidden DROP CONSTRAINT IF EXISTS tm_gauge_hidden_room_seq_from_member_seq_key;
ALTER TABLE tm_gauge_hidden ADD CONSTRAINT tm_gauge_hidden_room_from_step_key UNIQUE(room_seq, from_member_seq, game_step);

-- tm_gauge_message: to_member_seq, message_text nullable
ALTER TABLE tm_gauge_message ALTER COLUMN to_member_seq DROP NOT NULL;
ALTER TABLE tm_gauge_message ALTER COLUMN message_text DROP NOT NULL;
