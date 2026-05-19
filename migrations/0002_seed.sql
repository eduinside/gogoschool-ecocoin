-- ============================================================================
-- EcoinClass v2 — 시드 데이터 (글로벌 기본값)
-- ============================================================================
-- 학급별 데이터는 학급 생성 시 별도 흐름에서 복제됩니다.
-- 여기서는 class_id = NULL (글로벌)인 기본 환경 행동/뱃지만 등록.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 환경 행동 8종 (글로벌 기본)
-- ----------------------------------------------------------------------------

INSERT INTO eco_actions (id, class_id, category, title, description, coin_reward, carbon_saved_g, daily_limit, display_order) VALUES
  ('act_global_01', NULL, 'energy',    '교실 불 끄기',      '쉬는 시간/이동 수업 때 교실 조명을 껐어요',     2, 120,  3, 1),
  ('act_global_02', NULL, 'energy',    '컴퓨터 절전',       '사용 안 할 때 모니터·컴퓨터를 껐어요',         2, 200,  2, 2),
  ('act_global_03', NULL, 'water',     '양치컵 사용',       '양치할 때 컵을 사용했어요',                    1,  60,  3, 3),
  ('act_global_04', NULL, 'waste',     '분리배출',          '플라스틱·종이를 올바르게 분리했어요',          1,  40,  5, 4),
  ('act_global_05', NULL, 'waste',     '이면지 사용',       '한 면만 쓴 종이를 다시 사용했어요',            1,  30,  3, 5),
  ('act_global_06', NULL, 'transport', '걸어서 등하교',     '차 대신 걸어서 학교에 왔어요',                 3, 800,  1, 6),
  ('act_global_07', NULL, 'food',      '잔반 없이 먹기',    '급식을 남기지 않고 다 먹었어요',               2, 300,  1, 7),
  ('act_global_08', NULL, 'other',     '텀블러 사용',       '일회용 컵 대신 텀블러/물병을 썼어요',          2, 100,  3, 8);

-- ----------------------------------------------------------------------------
-- 뱃지 9종
-- ----------------------------------------------------------------------------

INSERT INTO badges (id, code, title, description, emoji, rarity) VALUES
  ('bdg_first_mine',     'first_mine',      '첫 채굴',         '처음으로 환경 행동을 인증했어요',          '🌱', 'common'),
  ('bdg_10_minings',     '10_minings',      '꾸준이',          '10번 이상 환경 행동을 인증했어요',         '✨', 'common'),
  ('bdg_50_minings',     '50_minings',      '에코 히어로',     '50번 이상 환경 행동을 인증했어요',         '🌳', 'rare'),
  ('bdg_100_coins',      '100_coins',       '백 코인 클럽',    '누적 100코인 달성',                        '🪙', 'common'),
  ('bdg_500_coins',      '500_coins',       '오백 코인 클럽',  '누적 500코인 달성',                        '💰', 'rare'),
  ('bdg_streak_7',       'streak_7',        '7일 연속',        '7일 연속 채굴했어요',                      '🔥', 'rare'),
  ('bdg_streak_30',      'streak_30',       '한 달 개근',      '30일 연속 채굴했어요',                     '👑', 'epic'),
  ('bdg_all_categories', 'all_categories',  '만능 에코러',     '6개 카테고리에서 모두 채굴했어요',         '🌈', 'rare'),
  ('bdg_carbon_10kg',    'carbon_10kg',     '탄소 10kg',       '누적 10kg CO₂ 절감',                       '🌍', 'epic');

-- ----------------------------------------------------------------------------
-- 보상 6종 (글로벌 기본 — 학급에서 복제·수정 가능)
-- ----------------------------------------------------------------------------

INSERT INTO rewards (id, class_id, category, title, description, cost_coins, stock, display_order) VALUES
  ('rwd_global_01', NULL, 'privilege',  '자리 바꾸기 쿠폰',     '원하는 자리로 1주일 이동',          50,  NULL, 1),
  ('rwd_global_02', NULL, 'privilege',  '숙제 패스',            '숙제 1회 면제',                     80,  NULL, 2),
  ('rwd_global_03', NULL, 'experience', '학급 영화 추천권',     '다음 영화 시간 영화를 골라요',      120, NULL, 3),
  ('rwd_global_04', NULL, 'item',       '친환경 학용품',        '재활용 노트 또는 연필',             30,  20,   4),
  ('rwd_global_05', NULL, 'experience', '학급 일일 반장',       '하루 동안 반장 역할',               100, NULL, 5),
  ('rwd_global_06', NULL, 'donation',   '환경단체 기부',        '학급 코인 모아 환경단체에 기부',    200, NULL, 6);

-- ----------------------------------------------------------------------------
-- 기본 설문 1종 — 가입 직후 사전 설문 (연구용)
-- ----------------------------------------------------------------------------

INSERT INTO surveys (id, class_id, type, title, description, trigger_type, trigger_meta, reward_coins, is_anonymous, allow_retake, is_active) VALUES
  ('srv_pre_signup', NULL, 'survey',
   '시작 전 설문',
   '에코인클래스를 시작하기 전에 환경에 대한 생각을 알려줘요.',
   'after_signup', NULL,
   5,    -- 완료 시 5코인
   0,    -- user_id 저장 (개인 추적 허용 — 사후/사전 비교용)
   0,    -- 재응답 불가
   1);

-- 사전 설문 문항
INSERT INTO survey_questions (id, survey_id, display_order, question_type, prompt, options, is_required) VALUES
  ('sq_pre_01', 'srv_pre_signup', 1, 'likert_5',
   '나는 환경을 지키는 일이 중요하다고 생각해요.',
   '[{"value":1,"label":"전혀 아니에요"},{"value":2,"label":"별로 아니에요"},{"value":3,"label":"보통이에요"},{"value":4,"label":"그래요"},{"value":5,"label":"정말 그래요"}]',
   1),

  ('sq_pre_02', 'srv_pre_signup', 2, 'likert_5',
   '나는 평소에 환경을 지키는 행동을 자주 해요.',
   '[{"value":1,"label":"전혀 아니에요"},{"value":2,"label":"별로 아니에요"},{"value":3,"label":"보통이에요"},{"value":4,"label":"그래요"},{"value":5,"label":"정말 그래요"}]',
   1),

  ('sq_pre_03', 'srv_pre_signup', 3, 'single_choice',
   '환경을 위해 가장 자주 하는 행동은 무엇인가요?',
   '[{"value":"recycle","label":"분리배출"},{"value":"save_water","label":"물 아끼기"},{"value":"save_energy","label":"전기 아끼기"},{"value":"walk","label":"걸어다니기"},{"value":"none","label":"별로 안 해요"}]',
   1),

  ('sq_pre_04', 'srv_pre_signup', 4, 'long_text',
   '환경을 지키기 위해 우리 반에서 같이 해보고 싶은 일이 있나요?',
   NULL, 0);

-- ----------------------------------------------------------------------------
-- 기본 퀴즈 1종 — 환경 상식 (always_available, 재응답 가능)
-- ----------------------------------------------------------------------------

INSERT INTO surveys (id, class_id, type, title, description, trigger_type, trigger_meta, reward_coins, reward_on_correct, is_anonymous, allow_retake, is_active) VALUES
  ('qz_eco_basics', NULL, 'quiz',
   '환경 상식 퀴즈',
   '환경에 대해 얼마나 알고 있는지 알아봐요!',
   'always_available', NULL,
   0,    -- 완료 자체 보상 없음
   2,    -- 정답 1개당 2코인
   0,
   1,    -- 재응답 가능 (단, 같은 학생은 일 1회 제한 — 서버에서 처리)
   1);

INSERT INTO survey_questions (id, survey_id, display_order, question_type, prompt, options, correct_value, is_required) VALUES
  ('qq_eco_01', 'qz_eco_basics', 1, 'single_choice',
   '다음 중 재활용이 가능한 것은?',
   '[{"value":"a","label":"기름 묻은 피자 박스"},{"value":"b","label":"깨끗한 페트병"},{"value":"c","label":"음식물이 묻은 비닐"},{"value":"d","label":"깨진 도자기"}]',
   'b', 1),

  ('qq_eco_02', 'qz_eco_basics', 2, 'single_choice',
   '온실가스를 가장 많이 배출하는 것은?',
   '[{"value":"a","label":"걷기"},{"value":"b","label":"자전거"},{"value":"c","label":"버스"},{"value":"d","label":"비행기"}]',
   'd', 1),

  ('qq_eco_03', 'qz_eco_basics', 3, 'single_choice',
   '양치컵을 사용하면 한 번에 몇 리터의 물을 아낄 수 있을까요?',
   '[{"value":"a","label":"약 1리터"},{"value":"b","label":"약 6리터"},{"value":"c","label":"약 30리터"},{"value":"d","label":"약 100리터"}]',
   'b', 1),

  ('qq_eco_04', 'qz_eco_basics', 4, 'single_choice',
   '플라스틱이 자연에서 완전히 분해되는 데 걸리는 시간은?',
   '[{"value":"a","label":"1~10년"},{"value":"b","label":"50~100년"},{"value":"c","label":"500년 이상"},{"value":"d","label":"하루"}]',
   'c', 1),

  ('qq_eco_05', 'qz_eco_basics', 5, 'multi_choice',
   '음식물 쓰레기를 줄이는 방법을 모두 골라요. (여러 개)',
   '[{"value":"a","label":"먹을 만큼만 받기"},{"value":"b","label":"남은 음식 다음에 먹기"},{"value":"c","label":"좋아하는 것만 먹기"},{"value":"d","label":"식단 미리 확인하기"}]',
   '["a","b","d"]', 1);

-- ----------------------------------------------------------------------------
-- 마이그레이션 기록
-- ----------------------------------------------------------------------------

INSERT INTO _migrations (version, name) VALUES (2, '0002_seed');
