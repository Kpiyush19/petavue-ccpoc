import { useEffect } from 'react';
import UserDetails from './components/UserDetails';
import Skeleton from './components/Skeleton';
import { useGetUserDetails } from './api/getUserDetails';
import { queryClient } from '../../lib/queryClient';

export const MyProfile = () => {
  const { data, isLoading, isSuccess } = useGetUserDetails({
    config: {
      staleTime: Infinity,
    },
  });

  useEffect(() => {
    return () => {
      queryClient.removeQueries({ queryKey: ['userDetails'] });
    };
  }, []);

  return (
    <div className="h-screen overflow-y-hidden flex flex-col bg-[var(--color-grey-50)]">
      <div className="bg-white border-b border-[var(--color-grey-200)] px-6 h-[64px] flex items-center">
        <h1 className="flex items-center text-base font-medium leading-7 text-[var(--color-text-primary)]">
          My Profile
        </h1>
      </div>

      <div className="flex w-full h-[calc(100%-64px)]">
        {isLoading ? (
          <ProfileSkeleton />
        ) : isSuccess ? (
          <UserDetails userDetail={data} />
        ) : null}
      </div>
    </div>
  );
};

const ProfileSkeleton = () => (
  <div className="rounded-lg overflow-auto w-full p-4 h-full">
    <div className="min-w-[900px] h-full">
      <div className="flex bg-white rounded-lg p-[30px] h-full w-full">
        <div className="flex flex-col gap-6 w-full">
          {/* Profile Image */}
          <div className="space-y-0.5 w-full">
            <Skeleton width="90px" height="20px" className="mb-4" />
            <Skeleton width="64px" height="64px" className="rounded-full" />
          </div>

          {/* Full Name */}
          <div className="space-y-0.5 w-full">
            <Skeleton width="70px" height="20px" className="mb-4" />
            <Skeleton width="40%" height="36px" className="max-w-lg min-w-64 rounded-lg" />
          </div>

          {/* Role */}
          <div className="space-y-0.5 w-full">
            <Skeleton width="35px" height="20px" className="mb-4" />
            <Skeleton width="40%" height="36px" className="max-w-lg min-w-64 rounded-lg" />
          </div>

          {/* Email */}
          <div className="space-y-0.5 w-full">
            <Skeleton width="40px" height="20px" className="mb-4" />
            <Skeleton width="40%" height="36px" className="max-w-lg min-w-64 rounded-lg" />
          </div>

          {/* Password */}
          <div className="space-y-0.5 w-full">
            <Skeleton width="65px" height="20px" className="mb-4" />
            <div className="flex gap-6">
              <Skeleton width="40%" height="36px" className="max-w-lg min-w-64 rounded-lg" />
              <Skeleton width="120px" height="36px" className="rounded-lg" />
            </div>
          </div>

          {/* API Key */}
          <div className="space-y-0.5 w-full">
            <Skeleton width="55px" height="20px" className="mb-4" />
            <Skeleton width="40%" height="36px" className="max-w-lg min-w-64 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default MyProfile;
