--
-- PostgreSQL database dump
--

\restrict MsZrDZuYqRoFeGceqBRbxw2Gchh9j8N8qdHwD85gSfuvI9j6v50zrA7mrHyPTf4

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

-- Started on 2025-12-29 17:07:57

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP DATABASE ourondo;
--
-- TOC entry 5000 (class 1262 OID 16389)
-- Name: ourondo; Type: DATABASE; Schema: -; Owner: user01
--

CREATE DATABASE ourondo WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'Korean_Korea.949';


ALTER DATABASE ourondo OWNER TO user01;

\unrestrict MsZrDZuYqRoFeGceqBRbxw2Gchh9j8N8qdHwD85gSfuvI9j6v50zrA7mrHyPTf4
\connect ourondo
\restrict MsZrDZuYqRoFeGceqBRbxw2Gchh9j8N8qdHwD85gSfuvI9j6v50zrA7mrHyPTf4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 230 (class 1259 OID 16619)
-- Name: tm_apply; Type: TABLE; Schema: public; Owner: user01
--

CREATE TABLE public.tm_apply (
    apply_seq bigint NOT NULL,
    user_seq bigint,
    product_type integer NOT NULL,
    apply_date date NOT NULL,
    gender character varying(10) NOT NULL,
    name character varying(100) NOT NULL,
    birth_year integer NOT NULL,
    height integer NOT NULL,
    contact character varying(50) NOT NULL,
    job character varying(200) NOT NULL,
    mbti character varying(10),
    source character varying(100),
    message text,
    agree boolean DEFAULT false NOT NULL,
    flag character varying(20) DEFAULT 'AA'::character varying,
    cre_dtime timestamp without time zone DEFAULT now()
);


ALTER TABLE public.tm_apply OWNER TO user01;

--
-- TOC entry 229 (class 1259 OID 16618)
-- Name: tm_apply_apply_seq_seq; Type: SEQUENCE; Schema: public; Owner: user01
--

CREATE SEQUENCE public.tm_apply_apply_seq_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tm_apply_apply_seq_seq OWNER TO user01;

--
-- TOC entry 5001 (class 0 OID 0)
-- Dependencies: 229
-- Name: tm_apply_apply_seq_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user01
--

ALTER SEQUENCE public.tm_apply_apply_seq_seq OWNED BY public.tm_apply.apply_seq;


--
-- TOC entry 232 (class 1259 OID 16646)
-- Name: tm_apply_files; Type: TABLE; Schema: public; Owner: user01
--

CREATE TABLE public.tm_apply_files (
    file_seq bigint NOT NULL,
    apply_seq bigint,
    file_type character varying(20) NOT NULL,
    file_path text NOT NULL,
    original_name text,
    cre_dtime timestamp without time zone DEFAULT now()
);


ALTER TABLE public.tm_apply_files OWNER TO user01;

--
-- TOC entry 231 (class 1259 OID 16645)
-- Name: tm_apply_files_file_seq_seq; Type: SEQUENCE; Schema: public; Owner: user01
--

CREATE SEQUENCE public.tm_apply_files_file_seq_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tm_apply_files_file_seq_seq OWNER TO user01;

--
-- TOC entry 5002 (class 0 OID 0)
-- Dependencies: 231
-- Name: tm_apply_files_file_seq_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user01
--

ALTER SEQUENCE public.tm_apply_files_file_seq_seq OWNED BY public.tm_apply_files.file_seq;


--
-- TOC entry 228 (class 1259 OID 16593)
-- Name: tm_product_type; Type: TABLE; Schema: public; Owner: user01
--

CREATE TABLE public.tm_product_type (
    product_seq bigint NOT NULL,
    product_name character varying(50)
);


ALTER TABLE public.tm_product_type OWNER TO user01;

--
-- TOC entry 227 (class 1259 OID 16592)
-- Name: tm_product_type_product_seq_seq; Type: SEQUENCE; Schema: public; Owner: user01
--

CREATE SEQUENCE public.tm_product_type_product_seq_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tm_product_type_product_seq_seq OWNER TO user01;

--
-- TOC entry 5003 (class 0 OID 0)
-- Dependencies: 227
-- Name: tm_product_type_product_seq_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user01
--

ALTER SEQUENCE public.tm_product_type_product_seq_seq OWNED BY public.tm_product_type.product_seq;


--
-- TOC entry 226 (class 1259 OID 16535)
-- Name: tm_qna; Type: TABLE; Schema: public; Owner: user01
--

CREATE TABLE public.tm_qna (
    qna_seq bigint NOT NULL,
    user_seq bigint,
    title character varying(200) NOT NULL,
    content text NOT NULL,
    cre_dtime timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    flag character varying(50) DEFAULT 'AA'::character varying,
    is_reply integer DEFAULT 0,
    is_modify integer DEFAULT 0,
    modify_content text,
    modify_dtime timestamp without time zone,
    is_secret integer DEFAULT 0
);


ALTER TABLE public.tm_qna OWNER TO user01;

--
-- TOC entry 225 (class 1259 OID 16534)
-- Name: tm_qna_qna_seq_seq; Type: SEQUENCE; Schema: public; Owner: user01
--

CREATE SEQUENCE public.tm_qna_qna_seq_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tm_qna_qna_seq_seq OWNER TO user01;

--
-- TOC entry 5004 (class 0 OID 0)
-- Dependencies: 225
-- Name: tm_qna_qna_seq_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user01
--

ALTER SEQUENCE public.tm_qna_qna_seq_seq OWNED BY public.tm_qna.qna_seq;


--
-- TOC entry 224 (class 1259 OID 16515)
-- Name: tm_qna_reply; Type: TABLE; Schema: public; Owner: user01
--

CREATE TABLE public.tm_qna_reply (
    qna_reply_seq bigint NOT NULL,
    user_seq bigint,
    qna_seq integer,
    content text NOT NULL,
    cre_dtime timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    flag character varying(50) DEFAULT 'AA'::character varying,
    is_modify integer DEFAULT 0,
    modify_content text,
    modify_dtime timestamp without time zone,
    is_secret integer DEFAULT 0
);


ALTER TABLE public.tm_qna_reply OWNER TO user01;

--
-- TOC entry 223 (class 1259 OID 16514)
-- Name: tm_qna_reply_qna_reply_seq_seq; Type: SEQUENCE; Schema: public; Owner: user01
--

CREATE SEQUENCE public.tm_qna_reply_qna_reply_seq_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tm_qna_reply_qna_reply_seq_seq OWNER TO user01;

--
-- TOC entry 5005 (class 0 OID 0)
-- Dependencies: 223
-- Name: tm_qna_reply_qna_reply_seq_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user01
--

ALTER SEQUENCE public.tm_qna_reply_qna_reply_seq_seq OWNED BY public.tm_qna_reply.qna_reply_seq;


--
-- TOC entry 220 (class 1259 OID 16447)
-- Name: tm_review; Type: TABLE; Schema: public; Owner: user01
--

CREATE TABLE public.tm_review (
    review_seq bigint NOT NULL,
    user_seq integer NOT NULL,
    user_id character varying(100) NOT NULL,
    review_desc text NOT NULL,
    cre_dtime timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    flag smallint DEFAULT 1,
    img_path character varying(300),
    is_modify integer,
    modify_dtime timestamp without time zone,
    review_type integer DEFAULT 1 NOT NULL,
    product_type integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.tm_review OWNER TO user01;

--
-- TOC entry 219 (class 1259 OID 16446)
-- Name: tm_review_review_seq_seq; Type: SEQUENCE; Schema: public; Owner: user01
--

CREATE SEQUENCE public.tm_review_review_seq_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tm_review_review_seq_seq OWNER TO user01;

--
-- TOC entry 5006 (class 0 OID 0)
-- Dependencies: 219
-- Name: tm_review_review_seq_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user01
--

ALTER SEQUENCE public.tm_review_review_seq_seq OWNED BY public.tm_review.review_seq;


--
-- TOC entry 222 (class 1259 OID 16498)
-- Name: tm_user; Type: TABLE; Schema: public; Owner: user01
--

CREATE TABLE public.tm_user (
    user_seq bigint NOT NULL,
    user_id character varying(100) NOT NULL,
    user_pw character varying(200) NOT NULL,
    user_name character varying(100),
    cre_dtime timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    flag character varying(100) DEFAULT 'WT'::character varying,
    admin_desc character varying(200),
    is_kakao integer DEFAULT 0,
    is_admin integer DEFAULT 0,
    kakao_id character varying,
    login_type character varying DEFAULT 'LOCAL'::character varying
);


ALTER TABLE public.tm_user OWNER TO user01;

--
-- TOC entry 221 (class 1259 OID 16497)
-- Name: tm_user_user_seq_seq; Type: SEQUENCE; Schema: public; Owner: user01
--

CREATE SEQUENCE public.tm_user_user_seq_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tm_user_user_seq_seq OWNER TO user01;

--
-- TOC entry 5007 (class 0 OID 0)
-- Dependencies: 221
-- Name: tm_user_user_seq_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user01
--

ALTER SEQUENCE public.tm_user_user_seq_seq OWNED BY public.tm_user.user_seq;


--
-- TOC entry 4808 (class 2604 OID 16622)
-- Name: tm_apply apply_seq; Type: DEFAULT; Schema: public; Owner: user01
--

ALTER TABLE ONLY public.tm_apply ALTER COLUMN apply_seq SET DEFAULT nextval('public.tm_apply_apply_seq_seq'::regclass);


--
-- TOC entry 4812 (class 2604 OID 16649)
-- Name: tm_apply_files file_seq; Type: DEFAULT; Schema: public; Owner: user01
--

ALTER TABLE ONLY public.tm_apply_files ALTER COLUMN file_seq SET DEFAULT nextval('public.tm_apply_files_file_seq_seq'::regclass);


--
-- TOC entry 4807 (class 2604 OID 16596)
-- Name: tm_product_type product_seq; Type: DEFAULT; Schema: public; Owner: user01
--

ALTER TABLE ONLY public.tm_product_type ALTER COLUMN product_seq SET DEFAULT nextval('public.tm_product_type_product_seq_seq'::regclass);


--
-- TOC entry 4801 (class 2604 OID 16538)
-- Name: tm_qna qna_seq; Type: DEFAULT; Schema: public; Owner: user01
--

ALTER TABLE ONLY public.tm_qna ALTER COLUMN qna_seq SET DEFAULT nextval('public.tm_qna_qna_seq_seq'::regclass);


--
-- TOC entry 4796 (class 2604 OID 16518)
-- Name: tm_qna_reply qna_reply_seq; Type: DEFAULT; Schema: public; Owner: user01
--

ALTER TABLE ONLY public.tm_qna_reply ALTER COLUMN qna_reply_seq SET DEFAULT nextval('public.tm_qna_reply_qna_reply_seq_seq'::regclass);


--
-- TOC entry 4785 (class 2604 OID 16450)
-- Name: tm_review review_seq; Type: DEFAULT; Schema: public; Owner: user01
--

ALTER TABLE ONLY public.tm_review ALTER COLUMN review_seq SET DEFAULT nextval('public.tm_review_review_seq_seq'::regclass);


--
-- TOC entry 4790 (class 2604 OID 16501)
-- Name: tm_user user_seq; Type: DEFAULT; Schema: public; Owner: user01
--

ALTER TABLE ONLY public.tm_user ALTER COLUMN user_seq SET DEFAULT nextval('public.tm_user_user_seq_seq'::regclass);


--
-- TOC entry 4992 (class 0 OID 16619)
-- Dependencies: 230
-- Data for Name: tm_apply; Type: TABLE DATA; Schema: public; Owner: user01
--

COPY public.tm_apply (apply_seq, user_seq, product_type, apply_date, gender, name, birth_year, height, contact, job, mbti, source, message, agree, flag, cre_dtime) FROM stdin;
2	11	2	2025-12-27	M	3	33	33	333	333	INTJ	지인소개	2323	t	PS	2025-12-14 14:33:33.96617
3	14	1	2025-12-18	M	er	11221	1212	12121212	1212	ESFJ	인스타그램	1212	t	RJ	2025-12-16 22:06:31.415881
1	11	1	2025-12-26	F	wer	233	2323	2323	2323	ENTJ	네이버 블로그	323	t	RJ	2025-12-14 14:29:51.814217
4	11	1	2025-12-19	M	이름	1994	184	010-0000-000	직업	INTP	인스타그램	123	t	PS	2025-12-16 23:14:38.237895
5	14	1	2025-12-26	M	민식	1444	133	010100101010101	직업	ENTJ	네이버 블로그	33333	t	PS	2025-12-21 18:00:34.432355
6	11	2	2025-12-25	M	우리의 온도	1994	180	010-0000-000	직업	ESFJ	인스타그램	111	t	AA	2025-12-29 15:59:59.509367
\.


--
-- TOC entry 4994 (class 0 OID 16646)
-- Dependencies: 232
-- Data for Name: tm_apply_files; Type: TABLE DATA; Schema: public; Owner: user01
--

COPY public.tm_apply_files (file_seq, apply_seq, file_type, file_path, original_name, cre_dtime) FROM stdin;
1	1	JOB	/uploads/1765690191808-7076.PNG	premium.PNG	2025-12-14 14:29:51.819247
2	1	PHOTO	/uploads/1765690191811-1863.PNG	premium.PNG	2025-12-14 14:29:51.821027
3	1	PHOTO	/uploads/1765690191813-7138.PNG	ìº¡ì².PNG	2025-12-14 14:29:51.821305
4	2	JOB	/uploads/1765690413961-807.PNG	premium.PNG	2025-12-14 14:33:33.969969
5	2	PHOTO	/uploads/1765690413963-7877.PNG	premium.PNG	2025-12-14 14:33:33.970308
6	2	PHOTO	/uploads/1765690413964-5138.PNG	ìº¡ì².PNG	2025-12-14 14:33:33.970618
7	3	JOB	/uploads/1765890391411-1365.PNG	ìº¡ì².PNG	2025-12-16 22:06:31.419049
8	3	PHOTO	/uploads/1765890391411-1063.PNG	premium.PNG	2025-12-16 22:06:31.420524
9	3	PHOTO	/uploads/1765890391414-6136.PNG	ìº¡ì².PNG	2025-12-16 22:06:31.420818
10	4	JOB	/uploads/1765894478228-508.PNG	premium.PNG	2025-12-16 23:14:38.24109
11	4	PHOTO	/uploads/1765894478232-3783.PNG	premium.PNG	2025-12-16 23:14:38.242312
12	4	PHOTO	/uploads/1765894478235-2083.PNG	ìº¡ì².PNG	2025-12-16 23:14:38.2426
13	5	JOB	/uploads/1766307634425-8906.PNG	premium.PNG	2025-12-21 18:00:34.435606
14	5	PHOTO	/uploads/1766307634429-4449.PNG	premium.PNG	2025-12-21 18:00:34.437073
15	5	PHOTO	/uploads/1766307634431-7642.PNG	ìº¡ì².PNG	2025-12-21 18:00:34.437329
16	6	JOB	/uploads/1766991599500-336237212.PNG	premium.PNG	2025-12-29 15:59:59.520851
17	6	PHOTO	/uploads/1766991599504-92382685.PNG	premium.PNG	2025-12-29 15:59:59.524253
18	6	PHOTO	/uploads/1766991599507-469788936.PNG	ìº¡ì².PNG	2025-12-29 15:59:59.524629
\.


--
-- TOC entry 4990 (class 0 OID 16593)
-- Dependencies: 228
-- Data for Name: tm_product_type; Type: TABLE DATA; Schema: public; Owner: user01
--

COPY public.tm_product_type (product_seq, product_name) FROM stdin;
1	Classic
2	Spark
\.


--
-- TOC entry 4988 (class 0 OID 16535)
-- Dependencies: 226
-- Data for Name: tm_qna; Type: TABLE DATA; Schema: public; Owner: user01
--

COPY public.tm_qna (qna_seq, user_seq, title, content, cre_dtime, flag, is_reply, is_modify, modify_content, modify_dtime, is_secret) FROM stdin;
1	1	te	te	2025-12-05 18:32:21.383967	DD	0	0	\N	\N	1
2	1	tes	tese	2025-12-05 18:41:09.327548	AA	0	0	\N	\N	1
3	11	ㅅ	ㅅ	2025-12-08 23:42:24.182147	AA	0	0	\N	\N	0
\.


--
-- TOC entry 4986 (class 0 OID 16515)
-- Dependencies: 224
-- Data for Name: tm_qna_reply; Type: TABLE DATA; Schema: public; Owner: user01
--

COPY public.tm_qna_reply (qna_reply_seq, user_seq, qna_seq, content, cre_dtime, flag, is_modify, modify_content, modify_dtime, is_secret) FROM stdin;
1	1	1	df	2025-12-05 18:32:24.239069	AA	0	\N	\N	0
2	8	2	wow	2025-12-05 19:43:58.328784	AA	0	\N	\N	0
3	11	3	ㅇㅇ	2025-12-16 23:51:19.739181	AA	0	\N	\N	0
\.


--
-- TOC entry 4982 (class 0 OID 16447)
-- Dependencies: 220
-- Data for Name: tm_review; Type: TABLE DATA; Schema: public; Owner: user01
--

COPY public.tm_review (review_seq, user_seq, user_id, review_desc, cre_dtime, flag, img_path, is_modify, modify_dtime, review_type, product_type) FROM stdin;
3	5	jiyoung88	좋은 사람들을 만날 수 있었어요. 다음에도 신청하고 싶네요.	2025-12-02 18:35:01.720492	1	\N	0	\N	1	1
4	2	kimmin	게임형 소개팅은 처음이었는데 정말 재밌었습니다!	2025-12-02 18:35:01.720492	1	\N	0	\N	1	1
7	10	hana	1:1 로테이션 방식이 생각보다 편하고 좋았어요.	2025-12-02 18:35:01.720492	1	\N	0	\N	1	1
8	12	jihoon	다들 매너가 좋아서 즐거운 시간 보냈습니다.	2025-12-02 18:35:01.720492	1	\N	0	\N	1	1
9	111	dev	익명으로 남길게요. 꽤 괜찮았어요!	2025-12-02 18:35:01.720492	1	\N	0	\N	1	1
10	15	eunjung	룸 분위기가 예쁘고 편안해서 마음 편히 대화했습니다.	2025-12-02 18:35:01.720492	1	\N	0	\N	1	1
11	20	yongmin	예상보다 훨씬 좋았고 진정성 있는 분들을 만났어요!	2025-12-02 18:35:01.720492	1	\N	0	\N	1	1
12	21	hyeji	아주 만족! 또 참여하고 싶어요 :)	2025-12-02 18:35:01.720492	1	\N	0	\N	1	1
1	1	user01	정말 만족스러운 소개팅이었어요. 분위기가 자연스러웠습니다!	2025-12-02 18:35:01.720492	1	\N	0	\N	2	1
2	3	minseo	처음엔 긴장했는데 진행이 매끄러워서 금방 분위기 좋아졌어요.	2025-12-02 18:35:01.720492	1	\N	0	\N	2	1
5	7	sohee_21	진행자분이 너무 친절했고 전반적으로 만족스러웠습니다.	2025-12-02 18:35:01.720492	1	\N	0	\N	2	1
6	9	thomas	소개팅 상대가 정말 괜찮았어요! 대화도 잘 맞았습니다.	2025-12-02 18:35:01.720492	1	\N	0	\N	2	1
\.


--
-- TOC entry 4984 (class 0 OID 16498)
-- Dependencies: 222
-- Data for Name: tm_user; Type: TABLE DATA; Schema: public; Owner: user01
--

COPY public.tm_user (user_seq, user_id, user_pw, user_name, cre_dtime, flag, admin_desc, is_kakao, is_admin, kakao_id, login_type) FROM stdin;
1	testuser	$2b$10$4LZqjPVreDByR8RriYgDneB.KZHZksdjIFGFUGml18Y/XnRnyMGuu	테스트유저	2025-12-02 21:06:25.995986	AA	0	0	0	\N	LOCAL
2	test	$2b$10$g1JtT7vEoFDa/6sVG1QeIOHkW/odyongu5JVPr/EbRSJyVPpU.ek2	112	2025-12-02 22:18:41.236169	AA	\N	0	0	\N	LOCAL
3	testuser1	$2b$10$DocqbrMExP5oi0A3bse/Pe9jGa.fSvK05wCalj2utxA2MMWseFOgK	testuser1	2025-12-02 22:26:29.927634	AA	\N	0	1	\N	LOCAL
4	admin	$2b$10$tNP.EVoc/Nh4ChwK19TMD.Ds5F8se4P2lDKRqFI83.eknTEykDqva	admin	2025-12-05 18:41:52.298361	DD	\N	0	0	\N	LOCAL
5	admin12	$2b$10$vbeQjcqiN8ZrkMaKeCKRjeH0HrXIx54xho8c1wYq59TXUV624BzPi	admin12	2025-12-05 18:41:57.242108	DD	\N	0	0	\N	LOCAL
8	admin1	$2b$10$tusmZTlUZRyA0WiPA90Qwu5Gfj7NA4GDxxofeTbQkDDtf9Y2Pg1ZS	admin1	2025-12-05 18:54:29.873164	DD	\N	0	1	\N	LOCAL
14	kakao_4645175611	KAKAO	카카오유저	2025-12-16 21:43:19.101819	AA	\N	0	1	4645175611	KAKAO
13	kakao_4640601953	KAKAO	카카오유저	2025-12-14 17:20:49.596312	AA	\N	0	1	4640601953	KAKAO
11	admin1	$2b$10$SGcjC.sSSN6zPgoCU85lY.nP6MdRbg6CTZJ7MJZgS6e3eGOnxBgoG	admin1	2025-12-08 23:41:21.648414	AA	\N	0	1	\N	LOCAL
\.


--
-- TOC entry 5008 (class 0 OID 0)
-- Dependencies: 229
-- Name: tm_apply_apply_seq_seq; Type: SEQUENCE SET; Schema: public; Owner: user01
--

SELECT pg_catalog.setval('public.tm_apply_apply_seq_seq', 6, true);


--
-- TOC entry 5009 (class 0 OID 0)
-- Dependencies: 231
-- Name: tm_apply_files_file_seq_seq; Type: SEQUENCE SET; Schema: public; Owner: user01
--

SELECT pg_catalog.setval('public.tm_apply_files_file_seq_seq', 18, true);


--
-- TOC entry 5010 (class 0 OID 0)
-- Dependencies: 227
-- Name: tm_product_type_product_seq_seq; Type: SEQUENCE SET; Schema: public; Owner: user01
--

SELECT pg_catalog.setval('public.tm_product_type_product_seq_seq', 1, false);


--
-- TOC entry 5011 (class 0 OID 0)
-- Dependencies: 225
-- Name: tm_qna_qna_seq_seq; Type: SEQUENCE SET; Schema: public; Owner: user01
--

SELECT pg_catalog.setval('public.tm_qna_qna_seq_seq', 3, true);


--
-- TOC entry 5012 (class 0 OID 0)
-- Dependencies: 223
-- Name: tm_qna_reply_qna_reply_seq_seq; Type: SEQUENCE SET; Schema: public; Owner: user01
--

SELECT pg_catalog.setval('public.tm_qna_reply_qna_reply_seq_seq', 3, true);


--
-- TOC entry 5013 (class 0 OID 0)
-- Dependencies: 219
-- Name: tm_review_review_seq_seq; Type: SEQUENCE SET; Schema: public; Owner: user01
--

SELECT pg_catalog.setval('public.tm_review_review_seq_seq', 12, true);


--
-- TOC entry 5014 (class 0 OID 0)
-- Dependencies: 221
-- Name: tm_user_user_seq_seq; Type: SEQUENCE SET; Schema: public; Owner: user01
--

SELECT pg_catalog.setval('public.tm_user_user_seq_seq', 14, true);


--
-- TOC entry 4829 (class 2606 OID 16657)
-- Name: tm_apply_files tm_apply_files_pkey; Type: CONSTRAINT; Schema: public; Owner: user01
--

ALTER TABLE ONLY public.tm_apply_files
    ADD CONSTRAINT tm_apply_files_pkey PRIMARY KEY (file_seq);


--
-- TOC entry 4827 (class 2606 OID 16639)
-- Name: tm_apply tm_apply_pkey; Type: CONSTRAINT; Schema: public; Owner: user01
--

ALTER TABLE ONLY public.tm_apply
    ADD CONSTRAINT tm_apply_pkey PRIMARY KEY (apply_seq);


--
-- TOC entry 4825 (class 2606 OID 16599)
-- Name: tm_product_type tm_product_type_pkey; Type: CONSTRAINT; Schema: public; Owner: user01
--

ALTER TABLE ONLY public.tm_product_type
    ADD CONSTRAINT tm_product_type_pkey PRIMARY KEY (product_seq);


--
-- TOC entry 4823 (class 2606 OID 16550)
-- Name: tm_qna tm_qna_pkey; Type: CONSTRAINT; Schema: public; Owner: user01
--

ALTER TABLE ONLY public.tm_qna
    ADD CONSTRAINT tm_qna_pkey PRIMARY KEY (qna_seq);


--
-- TOC entry 4821 (class 2606 OID 16528)
-- Name: tm_qna_reply tm_qna_reply_pkey; Type: CONSTRAINT; Schema: public; Owner: user01
--

ALTER TABLE ONLY public.tm_qna_reply
    ADD CONSTRAINT tm_qna_reply_pkey PRIMARY KEY (qna_reply_seq);


--
-- TOC entry 4815 (class 2606 OID 16460)
-- Name: tm_review tm_review_pkey; Type: CONSTRAINT; Schema: public; Owner: user01
--

ALTER TABLE ONLY public.tm_review
    ADD CONSTRAINT tm_review_pkey PRIMARY KEY (review_seq);


--
-- TOC entry 4817 (class 2606 OID 16509)
-- Name: tm_user tm_user_pkey; Type: CONSTRAINT; Schema: public; Owner: user01
--

ALTER TABLE ONLY public.tm_user
    ADD CONSTRAINT tm_user_pkey PRIMARY KEY (user_seq);


--
-- TOC entry 4819 (class 2606 OID 16558)
-- Name: tm_user uq_tm_user_user_id_flag; Type: CONSTRAINT; Schema: public; Owner: user01
--

ALTER TABLE ONLY public.tm_user
    ADD CONSTRAINT uq_tm_user_user_id_flag UNIQUE (user_id, flag);


--
-- TOC entry 4833 (class 2606 OID 16658)
-- Name: tm_apply_files tm_apply_files_apply_seq_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user01
--

ALTER TABLE ONLY public.tm_apply_files
    ADD CONSTRAINT tm_apply_files_apply_seq_fkey FOREIGN KEY (apply_seq) REFERENCES public.tm_apply(apply_seq);


--
-- TOC entry 4832 (class 2606 OID 16640)
-- Name: tm_apply tm_apply_user_seq_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user01
--

ALTER TABLE ONLY public.tm_apply
    ADD CONSTRAINT tm_apply_user_seq_fkey FOREIGN KEY (user_seq) REFERENCES public.tm_user(user_seq);


--
-- TOC entry 4830 (class 2606 OID 16529)
-- Name: tm_qna_reply tm_qna_reply_user_seq_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user01
--

ALTER TABLE ONLY public.tm_qna_reply
    ADD CONSTRAINT tm_qna_reply_user_seq_fkey FOREIGN KEY (user_seq) REFERENCES public.tm_user(user_seq);


--
-- TOC entry 4831 (class 2606 OID 16551)
-- Name: tm_qna tm_qna_user_seq_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user01
--

ALTER TABLE ONLY public.tm_qna
    ADD CONSTRAINT tm_qna_user_seq_fkey FOREIGN KEY (user_seq) REFERENCES public.tm_user(user_seq);


-- Completed on 2025-12-29 17:07:57

--
-- PostgreSQL database dump complete
--

\unrestrict MsZrDZuYqRoFeGceqBRbxw2Gchh9j8N8qdHwD85gSfuvI9j6v50zrA7mrHyPTf4

