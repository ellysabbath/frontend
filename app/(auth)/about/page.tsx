'use client';

import React, { useState, useEffect } from 'react';

const API_URL = 'https://bahifinal.pythonanywhere.com/';

interface TeamMember {
  id: number;
  name: string;
  role: string;
  bio: string;
  image: string;
  twitter_url?: string;
  linkedin_url?: string;
  github_url?: string;
}

interface Statistic {
  id: number;
  value: string;
  label: string;
}

interface CompanyInfo {
  tab_type: 'mission' | 'vision' | 'values';
  content: string;
}

const AboutUs: React.FC = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [statistics, setStatistics] = useState<Statistic[]>([]);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo[]>([]);
  const [activeTab, setActiveTab] = useState<CompanyInfo['tab_type']>('mission');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [teamRes, statsRes, infoRes] = await Promise.all([
          fetch(API_URL + 'team-members/'),
          fetch(API_URL + 'statistics/'),
          fetch(API_URL + 'company-info/'),
        ]);
        const [teamData, statsData, infoData] = await Promise.all([
          teamRes.json(),
          statsRes.json(),
          infoRes.json(),
        ]);
        setTeamMembers(teamData);
        setStatistics(statsData);
        setCompanyInfo(infoData);
      } catch (e) {
        console.error('Failed to fetch data', e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const currentContent = companyInfo.find(ci => ci.tab_type === activeTab)?.content || 'Loading...';

  if (loading) return <p className="p-6 text-center text-gray-500">Loading...</p>;

  return (
    <div className="px-6 py-12 max-w-7xl mx-auto">
      {/* Header */}
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-extrabold text-indigo-700 mb-4">About BAHI SDA CHURCH</h1>
        <p className="text-gray-600 max-w-2xl mx-auto text-lg">
          We are a faith community committed to sharing hope, health, and service through Seventh-day Adventist teachings.
        </p>
      </header>

      {/* Statistics Section */}



      {/* Tabs Section */}
      <section className="mb-16">
        <div className="flex justify-center space-x-4 mb-6">
          {['mission', 'vision', 'values'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as CompanyInfo['tab_type'])}
              className={`px-5 py-2 text-sm font-medium rounded-full border transition duration-200 ${
                activeTab === tab
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                  : 'text-indigo-600 border-indigo-300 hover:bg-indigo-50'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        <div className="max-w-3xl mx-auto text-center text-gray-700 text-lg leading-relaxed bg-white p-6 rounded-lg shadow-sm">
          {currentContent}
        </div>
      </section>

      {/* Team Section */}
      <section>
        <h2 className="text-3xl font-semibold text-center text-indigo-700 mb-10">
          Meet Our Leaders
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {teamMembers.map(({ id, name, role, bio, image, twitter_url, linkedin_url, github_url }) => (
            <div
              key={id}
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition duration-300 text-center"
            >
              <img
                src={image}
                alt={name}
                className="w-24 h-24 rounded-full mx-auto mb-4 object-cover ring-2 ring-indigo-400"
              />
              <h3 className="text-lg font-semibold text-gray-800">{name}</h3>
              <p className="text-indigo-600 text-sm mb-2">{role}</p>
              <p className="text-sm text-gray-600 mb-4">{bio}</p>
              <div className="flex justify-center space-x-4 text-gray-500">
                {twitter_url && (
                  <a href={twitter_url} aria-label="Twitter" className="hover:text-blue-400">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53..." />
                    </svg>
                  </a>
                )}
                {linkedin_url && (
                  <a href={linkedin_url} aria-label="LinkedIn" className="hover:text-blue-700">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M4.98 3.5C4.98 5.2..." />
                    </svg>
                  </a>
                )}
                {github_url && (
                  <a href={github_url} aria-label="GitHub" className="hover:text-gray-900">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2a10 10 0 0 0-3.16..." />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AboutUs;
