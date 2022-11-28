import path from "path";

export const BaseURL = "https://mryhryki.com";

export const RootDir = path.resolve(__dirname);
export const PostsDir = path.resolve(RootDir, "posts");
export const SiteDir = path.resolve(RootDir, "site");

export const SourceArticleDir = path.resolve(PostsDir, "article");
export const SourceMemoDir = path.resolve(PostsDir, "memo");
export const SourceScrapDir = path.resolve(PostsDir, "scrap");
export const SourceSlideDir = path.resolve(PostsDir, "slide");
export const SourceZennDir = path.resolve(RootDir, "articles");

export const DestinationBlogDir = path.resolve(SiteDir, "blog");
export const DestinationSlideDir = path.resolve(SiteDir, "slide");
export const DestinationScrapDir = path.resolve(SiteDir, "scrap");
