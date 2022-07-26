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
  // const viewHotPoints = post.viewsAmount / 100;
  // const scoreHotPoints = post.score;
  // const commentHotPoints = post.commentsAmount * 10;
  // const newHotPoints = viewHotPoints + scoreHotPoints + commentHotPoints;

  // create previousCheckHotPoint
  // if recent HP < prevHP lower HP, set prevHP as recent

  // post.hotPoints = newHotPoints;
  if (post.hotPoints <= hotPointsToStop) {
    return post;
  }
  if (post.hotPoints > post.hotPointsCheck.lastHotCheckPoints) {
    post.hotPointsCheck.lastHotCheckPoints = post.hotPoints;
    post.hotPointsCheck.lastHotCheckDate = new Date().getTime();
    return post;
  }

  const percentToDecreaseHotPerHour = 2;
  const percentToDecreaseHotPerMin: number = +(percentToDecreaseHotPerHour / 60).toFixed(3);
  const minutesFromLastCheck: number = Math.round(Math.abs(
    new Date().getTime() / 1000 - post.hotPointsCheck.lastHotCheckDate / 1000)) / 60;
  const pointsAmountToDecrease = minutesFromLastCheck * percentToDecreaseHotPerMin;

  post.hotPoints = +(post.hotPoints - pointsAmountToDecrease).toFixed(2);
  post.hotPointsCheck.lastHotCheckPoints = post.hotPoints;
  post.hotPointsCheck.lastHotCheckDate = new Date().getTime();
  return post;
}
