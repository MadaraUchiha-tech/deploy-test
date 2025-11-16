// import React, { useState, useEffect } from 'react';
// import UploadZone from './UploadZone';
// import Tabs from './Tabs';
// import FileGrid from './FileGrid';
// import Logs from './Logs';
// import { Search, Image as ImageIcon, Video, Database, Folder } from 'lucide-react';
// import { getUploadedFiles } from '../services/api';

// const TABS = [
//   { name: 'Upload' },
//   { name: 'Browse Files' },
//   { name: 'Logs' },
// ];

// const FOLDERS = [
//   { id: 'all', name: 'All Files', icon: Folder, color: 'text-gray-400' },
//   { id: 'images', name: 'Images', icon: ImageIcon, color: 'text-purple-400' },
//   { id: 'videos', name: 'Videos', icon: Video, color: 'text-pink-400' },
//   { id: 'sql', name: 'SQL', icon: Database, color: 'text-blue-400' },
//   { id: 'nosql', name: 'NoSQL', icon: Database, color: 'text-green-400' },
// ];

// const MainContent = () => {
//   const [activeTab, setActiveTab] = useState('Upload');
//   const [selectedFolder, setSelectedFolder] = useState('all');
//   const [folderCounts, setFolderCounts] = useState({
//     all: 0,
//     images: 0,
//     videos: 0,
//     sql: 0,
//     nosql: 0
//   });

//   // Fetch folder counts
//   const updateFolderCounts = async () => {
//     try {
//       const data = await getUploadedFiles({ limit: 100 });
//       const files = data.files || [];

//       const counts = {
//         all: files.length,
//         images: files.filter(f => f.type === 'media' && f.category === 'Images').length,
//         videos: files.filter(f => f.type === 'media' && f.category === 'Videos').length,
//         sql: files.filter(f => f.type === 'json' && f.db_type === 'PostgreSQL').length,
//         nosql: files.filter(f => f.type === 'json' && f.db_type === 'MongoDB').length,
//       };

//       setFolderCounts(counts);
//     } catch (error) {
//       console.error('Failed to fetch folder counts:', error);
//     }
//   };

//   useEffect(() => {
//     if (activeTab === 'Browse Files') {
//       updateFolderCounts();
//       const interval = setInterval(updateFolderCounts, 10000);
//       return () => clearInterval(interval);
//     }
//   }, [activeTab]);

//   return (
//     <main className="flex-1 p-8 overflow-y-auto">
//       <h1 className="text-3xl font-bold text-white">Cosmio</h1>
//       <Tabs tabs={TABS} activeTab={activeTab} setActiveTab={setActiveTab} />
//       <div>
//         {activeTab === 'Upload' && <UploadZone />}
//         {activeTab === 'Browse Files' && (
//           <div>
//             {/* Folder Navigation */}
//             <div className="mb-6">
//               <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
//                 {FOLDERS.map(folder => {
//                   const Icon = folder.icon;
//                   const isSelected = selectedFolder === folder.id;
//                   return (
//                     <button
//                       key={folder.id}
//                       onClick={() => setSelectedFolder(folder.id)}
//                       className={`p-4 rounded-lg border transition-all ${
//                         isSelected
//                           ? 'bg-white/10 border-white/30 shadow-lg'
//                           : 'bg-white/5 border-white/10 hover:bg-white/10'
//                       }`}
//                     >
//                       <div className="flex items-center gap-3">
//                         <Icon className={`w-6 h-6 ${isSelected ? folder.color : 'text-gray-400'}`} />
//                         <div className="text-left flex-1">
//                           <p className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-300'}`}>
//                             {folder.name}
//                           </p>
//                           <p className="text-xs text-gray-500">
//                             {folderCounts[folder.id]} files
//                           </p>
//                         </div>
//                       </div>
//                     </button>
//                   );
//                 })}
//               </div>
//             </div>

//             {/* Search Bar */}
//             <div className="flex justify-between items-center mb-6">
//               <div className="relative w-full max-w-xs">
//                 <input
//                   type="text"
//                   placeholder="Search by filename..."
//                   className="bg-white/10 border border-white/20 rounded-md py-2 pl-10 pr-4 w-full text-sm placeholder-gray-400"
//                 />
//                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
//               </div>
//             </div>

//             <FileGrid selectedFolder={selectedFolder} />
//           </div>
//         )}
//         {activeTab === 'Logs' && <Logs />}
//       </div>
//     </main>
//   );
// };

// export default MainContent;
import React, { useState, useEffect } from 'react';
import UploadZone from './UploadZone';
import Tabs from './Tabs';
import FileGrid from './FileGrid';
import Logs from './Logs';
import { Search, Image as ImageIcon, Video, Database, Folder } from 'lucide-react';
import { getUploadedFiles } from '../services/api';

const TABS = [
  { name: 'Upload' },
  { name: 'Browse Files' },
  { name: 'Logs' },
];

const FOLDERS = [
  { id: 'all', name: 'All Files', icon: Folder, color: 'text-gray-400' },
  { id: 'images', name: 'Images', icon: ImageIcon, color: 'text-purple-400' },
  { id: 'videos', name: 'Videos', icon: Video, color: 'text-pink-400' },
  { id: 'sql', name: 'SQL', icon: Database, color: 'text-blue-400' },
  { id: 'nosql', name: 'NoSQL', icon: Database, color: 'text-green-400' },
];

const MainContent = () => {
  const [activeTab, setActiveTab] = useState('Upload');
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [folderCounts, setFolderCounts] = useState({
    all: 0,
    images: 0,
    videos: 0,
    sql: 0,
    nosql: 0
  });

  // Fetch folder counts
  const updateFolderCounts = async () => {
    try {
      const data = await getUploadedFiles({ limit: 100 });
      const files = data.files || [];

      const counts = {
        all: files.length,
        images: files.filter(f => f.type === 'media' && f.category === 'Images').length,
        videos: files.filter(f => f.type === 'media' && f.category === 'Videos').length,
        sql: files.filter(f => f.type === 'json' && f.db_type === 'PostgreSQL').length,
        nosql: files.filter(f => f.type === 'json' && f.db_type === 'MongoDB').length,
      };

      setFolderCounts(counts);
    } catch (error) {
      console.error('Failed to fetch folder counts:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'Browse Files') {
      updateFolderCounts();
      const interval = setInterval(updateFolderCounts, 10000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  return (
    <main className="flex-1 p-8 overflow-y-auto">
      <h1 className="text-3xl font-bold text-white">Cosmio</h1>

      <Tabs tabs={TABS} activeTab={activeTab} setActiveTab={setActiveTab} />

      <div>
        {activeTab === 'Upload' && <UploadZone />}

        {activeTab === 'Browse Files' && (
          <div>
            {/* Folder Navigation */}
            <div className="mb-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {FOLDERS.map(folder => {
                  const Icon = folder.icon;
                  const isSelected = selectedFolder === folder.id;
                  return (
                    <button
                      key={folder.id}
                      onClick={() => setSelectedFolder(folder.id)}
                      className={`p-4 rounded-lg border transition-all ${
                        isSelected
                          ? 'bg-white/10 border-white/30 shadow-lg'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-6 h-6 ${isSelected ? folder.color : 'text-gray-400'}`} />
                        <div className="text-left flex-1">
                          <p className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                            {folder.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {folderCounts[folder.id]} files
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

         
           
            {/* File Grid */}
            <FileGrid selectedFolder={selectedFolder} searchQuery={searchQuery} />
          </div>
        )}

        {activeTab === 'Logs' && <Logs />}
      </div>
    </main>
  );
};

export default MainContent;
