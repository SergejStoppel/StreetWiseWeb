import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FaCalendarAlt, FaUser, FaArrowRight, FaSearch, FaTags, FaClock } from 'react-icons/fa';

const BlogContainer = styled.div`
  min-height: 100vh;
  background-color: var(--color-bg-primary);
`;

const HeroSection = styled.section`
  padding: var(--spacing-2xl) 0 var(--spacing-xl);
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
  color: var(--color-white);
  text-align: center;
`;

const HeroContent = styled.div`
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: 0 var(--container-padding);
`;

const HeroTitle = styled.h1`
  font-size: var(--font-size-h1);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--spacing-sm);
  color: var(--color-white);
`;

const HeroSubtitle = styled.p`
  font-size: var(--font-size-h4);
  font-weight: var(--font-weight-regular);
  margin-bottom: var(--spacing-lg);
  color: var(--color-white);
  opacity: 0.9;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
`;

const BlogSection = styled.section`
  padding: var(--spacing-2xl) 0;
`;

const BlogContent = styled.div`
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: 0 var(--container-padding);
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: var(--spacing-2xl);
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: var(--spacing-xl);
  }
`;

const MainContent = styled.div``;

const Sidebar = styled.div`
  @media (max-width: 1024px) {
    order: -1;
  }
`;

const SearchBox = styled.div`
  background-color: var(--color-white);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  margin-bottom: var(--spacing-lg);
`;

const SearchTitle = styled.h3`
  font-size: var(--font-size-h4);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--spacing-md);
  color: var(--color-text-primary);
`;

const SearchForm = styled.form`
  display: flex;
  gap: var(--spacing-xs);
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 0.75rem;
  border: 2px solid var(--color-gray-border);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-body);
  
  &:focus {
    outline: none;
    border-color: var(--color-primary);
  }
`;

const SearchButton = styled.button`
  padding: 0.75rem 1rem;
  background-color: var(--color-primary);
  color: var(--color-white);
  border: none;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  
  &:hover {
    background-color: var(--color-primary-hover);
  }
`;

const CategoriesBox = styled.div`
  background-color: var(--color-white);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  margin-bottom: var(--spacing-lg);
`;

const CategoryList = styled.ul`
  list-style: none;
  padding: 0;
`;

const CategoryItem = styled.li`
  padding: var(--spacing-xs) 0;
  border-bottom: 1px solid var(--color-gray-border);
  
  &:last-child {
    border-bottom: none;
  }
`;

const CategoryLink = styled.a`
  color: var(--color-text-secondary);
  text-decoration: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: color var(--transition-fast);
  
  &:hover {
    color: var(--color-primary);
  }
`;

const CategoryCount = styled.span`
  font-size: var(--font-size-small);
  color: var(--color-text-muted);
`;

const BlogGrid = styled.div`
  display: grid;
  gap: var(--spacing-xl);
`;

const FeaturedPost = styled.article`
  background-color: var(--color-white);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  transition: all var(--transition-fast);
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
  }
`;

const PostImage = styled.div`
  height: 300px;
  background: linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-secondary-light) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: var(--color-primary);
`;

const PostContent = styled.div`
  padding: var(--spacing-lg);
`;

const PostMeta = styled.div`
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  font-size: var(--font-size-small);
  color: var(--color-text-muted);
`;

const PostMetaItem = styled.span`
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
`;

const PostTitle = styled.h2`
  font-size: var(--font-size-h3);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--spacing-sm);
  color: var(--color-text-primary);
  line-height: var(--line-height-tight);
`;

const PostExcerpt = styled.p`
  font-size: var(--font-size-body);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
  margin-bottom: var(--spacing-md);
`;

const PostTags = styled.div`
  display: flex;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-md);
  flex-wrap: wrap;
`;

const PostTag = styled.span`
  background-color: var(--color-primary-light);
  color: var(--color-primary);
  padding: 0.25rem 0.5rem;
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-small);
`;

const ReadMoreLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--color-primary);
  text-decoration: none;
  font-weight: var(--font-weight-medium);
  transition: color var(--transition-fast);
  
  &:hover {
    color: var(--color-primary-hover);
  }
`;

const RegularPost = styled.article`
  background-color: var(--color-white);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }
`;

const ComingSoonNotice = styled.div`
  background-color: var(--color-warning-light);
  border: 1px solid var(--color-warning);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-lg);
  text-align: center;
  margin-bottom: var(--spacing-xl);
`;

const ComingSoonTitle = styled.h3`
  color: var(--color-warning-dark);
  font-size: var(--font-size-h4);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--spacing-sm);
`;

const ComingSoonText = styled.p`
  color: var(--color-warning-dark);
  font-size: var(--font-size-body);
`;

const BlogPage = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const featuredPost = {
    title: "The Ultimate Guide to Website Accessibility for Small Businesses",
    excerpt: "Learn why website accessibility isn't just about compliance—it's about reaching more customers, improving SEO, and protecting your business from legal risks.",
    author: "SiteCraft Team",
    date: "March 15, 2024",
    readTime: "8 min read",
    tags: ["Accessibility", "Legal", "SEO"]
  };

  const regularPosts = [
    {
      title: "5 SEO Mistakes That Are Killing Your Local Business",
      excerpt: "Discover the most common SEO errors small businesses make and how to fix them for better search rankings.",
      author: "SiteCraft Team",
      date: "March 10, 2024",
      readTime: "6 min read",
      tags: ["SEO", "Local Business"]
    },
    {
      title: "Mobile-First Design: Why It Matters More Than Ever",
      excerpt: "With 60% of web traffic coming from mobile devices, learn why mobile-first design is crucial for your business success.",
      author: "SiteCraft Team",
      date: "March 5, 2024",
      readTime: "5 min read",
      tags: ["Design", "Mobile", "UX"]
    },
    {
      title: "How to Improve Your Website's Loading Speed",
      excerpt: "Page speed affects everything from user experience to SEO rankings. Here's how to make your site lightning fast.",
      author: "SiteCraft Team",
      date: "February 28, 2024",
      readTime: "7 min read",
      tags: ["Performance", "Technical"]
    }
  ];

  const categories = [
    { name: "Website Accessibility", count: 12 },
    { name: "SEO & Marketing", count: 8 },
    { name: "Web Design", count: 6 },
    { name: "Performance", count: 4 },
    { name: "Legal & Compliance", count: 3 }
  ];

  return (
    <BlogContainer>
      <HeroSection>
        <HeroContent>
          <HeroTitle>SiteCraft Blog</HeroTitle>
          <HeroSubtitle>
            Insights, tips, and strategies to help your small business thrive online
          </HeroSubtitle>
        </HeroContent>
      </HeroSection>

      <BlogSection>
        <BlogContent>
          <MainContent>
            <ComingSoonNotice>
              <ComingSoonTitle>Blog Coming Soon!</ComingSoonTitle>
              <ComingSoonText>
                We're currently developing valuable content to help you succeed online. 
                Our blog will feature expert insights on accessibility, SEO, and web design for small businesses.
              </ComingSoonText>
            </ComingSoonNotice>

            <BlogGrid>
              {/* Featured Post */}
              <FeaturedPost>
                <PostImage>
                  <FaTags />
                </PostImage>
                <PostContent>
                  <PostMeta>
                    <PostMetaItem>
                      <FaUser /> {featuredPost.author}
                    </PostMetaItem>
                    <PostMetaItem>
                      <FaCalendarAlt /> {featuredPost.date}
                    </PostMetaItem>
                    <PostMetaItem>
                      <FaClock /> {featuredPost.readTime}
                    </PostMetaItem>
                  </PostMeta>
                  <PostTitle>{featuredPost.title}</PostTitle>
                  <PostExcerpt>{featuredPost.excerpt}</PostExcerpt>
                  <PostTags>
                    {featuredPost.tags.map((tag, index) => (
                      <PostTag key={index}>{tag}</PostTag>
                    ))}
                  </PostTags>
                  <ReadMoreLink to="#" onClick={(e) => e.preventDefault()}>
                    Read More <FaArrowRight />
                  </ReadMoreLink>
                </PostContent>
              </FeaturedPost>

              {/* Regular Posts */}
              {regularPosts.map((post, index) => (
                <RegularPost key={index}>
                  <PostMeta>
                    <PostMetaItem>
                      <FaUser /> {post.author}
                    </PostMetaItem>
                    <PostMetaItem>
                      <FaCalendarAlt /> {post.date}
                    </PostMetaItem>
                    <PostMetaItem>
                      <FaClock /> {post.readTime}
                    </PostMetaItem>
                  </PostMeta>
                  <PostTitle style={{ fontSize: 'var(--font-size-h4)' }}>{post.title}</PostTitle>
                  <PostExcerpt>{post.excerpt}</PostExcerpt>
                  <PostTags>
                    {post.tags.map((tag, tagIndex) => (
                      <PostTag key={tagIndex}>{tag}</PostTag>
                    ))}
                  </PostTags>
                  <ReadMoreLink to="#" onClick={(e) => e.preventDefault()}>
                    Read More <FaArrowRight />
                  </ReadMoreLink>
                </RegularPost>
              ))}
            </BlogGrid>
          </MainContent>

          <Sidebar>
            <SearchBox>
              <SearchTitle>Search Articles</SearchTitle>
              <SearchForm onSubmit={(e) => e.preventDefault()}>
                <SearchInput
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <SearchButton type="submit">
                  <FaSearch />
                </SearchButton>
              </SearchForm>
            </SearchBox>

            <CategoriesBox>
              <SearchTitle>Categories</SearchTitle>
              <CategoryList>
                {categories.map((category, index) => (
                  <CategoryItem key={index}>
                    <CategoryLink href="#" onClick={(e) => e.preventDefault()}>
                      <span>{category.name}</span>
                      <CategoryCount>({category.count})</CategoryCount>
                    </CategoryLink>
                  </CategoryItem>
                ))}
              </CategoryList>
            </CategoriesBox>
          </Sidebar>
        </BlogContent>
      </BlogSection>
    </BlogContainer>
  );
};

export default BlogPage;