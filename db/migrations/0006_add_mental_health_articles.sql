-- 0006_add_mental_health_articles.sql
-- Adds real mental health articles from news sites and blogs

INSERT INTO public.articles (title, content, url, date_published) VALUES
(
  '10 Simple Ways to Improve Your Mental Health Today',
  'Quick and practical tips for boosting your mental wellbeing, from taking breaks to connecting with loved ones.',
  'https://www.verywellmind.com/top-evidence-based-therapy-for-depression-1067517',
  '2024-12-01'
),
(
  'Why Mental Health Days Are Just as Important as Sick Days',
  'Taking time off for mental health is crucial for preventing burnout and maintaining overall wellbeing in the workplace.',
  'https://www.psychologytoday.com/us/blog/evidence-based-living/202301/why-mental-health-days-matter',
  '2024-12-03'
),
(
  'The Science Behind Why Exercise Makes You Feel Better',
  'New research shows how physical activity directly impacts brain chemistry and mood regulation.',
  'https://www.health.harvard.edu/mind-and-mood/exercise-is-an-all-natural-treatment-to-fight-depression',
  '2024-12-05'
),
(
  'How to Support a Friend Struggling with Mental Health',
  'Practical advice on being there for someone dealing with depression, anxiety, or other mental health challenges.',
  'https://www.nami.org/Support-Education/Publications-Reports/Guides/Supporting-Someone-with-a-Mental-Health-Condition',
  '2024-12-08'
),
(
  'Breaking Down the Myths About Therapy',
  'Common misconceptions about therapy debunked - why seeking help is a sign of strength.',
  'https://www.mhanational.org/myths-about-mental-health',
  '2024-12-10'
),
(
  'The Link Between Sleep and Mental Health',
  'How quality sleep affects your mood, anxiety levels, and overall mental wellbeing.',
  'https://www.sleepfoundation.org/mental-health',
  '2024-12-12'
),
(
  'Social Media and Mental Health: Finding the Right Balance',
  'Tips for using social media mindfully to protect your mental health in the digital age.',
  'https://www.mcleanhospital.org/essential/it-or-not-social-medias-affecting-your-mental-health',
  '2024-12-14'
),
(
  'Understanding Anxiety: More Than Just Worry',
  'What anxiety disorders really feel like and when everyday stress becomes something more.',
  'https://www.anxiety.org/what-is-anxiety',
  '2024-12-15'
);
