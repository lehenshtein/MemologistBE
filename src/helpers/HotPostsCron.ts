import { CronJob } from 'cron';
import Post, { IPost, IPostModel } from '../models/Posts.model';

export function checkHotPosts () {
  const job = new CronJob(
    '0 0 * * * * ',
    function () {
      getPosts().then().catch(err => console.log(err));
    },
    null,
    true,
    'Europe/Kiev'
  );
}

async function getPosts () {
  const lastDaysToTakePosts = 7;
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - lastDaysToTakePosts);
  try {
    const posts: IPostModel[] = await Post.find({ createdAt: { $gt: d } })
      .sort('-createdAt');
    if (!posts) {
      return;
    }
    posts.map(post => {
      updateHotPoints(post);
      return post.save();
    });
    console.log(posts);
  } catch (err) {
    console.log(err);
  }
}

function updateHotPoints (post: IPost) {
  const hotPointsToStop = -20;
  const viewHotPoints = post.viewsAmount / 100;
  const scoreHotPoints = post.score;
  const commentHotPoints = post.commentsAmount * 10;
  const newHotPoints = viewHotPoints + scoreHotPoints + commentHotPoints;

  // post.hotPoints = newHotPoints;
  if (post.hotPoints <= hotPointsToStop) {
    return post;
  }
  if (newHotPoints > post.hotPoints) {
    post.hotPoints = newHotPoints;
    post.lastHotCheckDate = new Date();
    return post;
  }

  const percentToDecreaseHotPerHour = 2;
  const percentToDecreaseHotPerMin: number = +(percentToDecreaseHotPerHour / 60).toFixed(3);
  const minutesFromLastCheck: number = Math.round(Math.abs(
    new Date().getTime() / 1000 - post.lastHotCheckDate.getTime() / 1000)) / 60;
  const pointsAmountToDecrease = minutesFromLastCheck * percentToDecreaseHotPerMin;

  post.hotPoints = +(newHotPoints - pointsAmountToDecrease).toFixed(2);
  return post;
}
