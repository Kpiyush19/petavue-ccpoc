import Skeleton from './index';

export const SourcesSkeleton = () => {
  return (
    <table
      className="m-2"
      style={{
        borderTopLeftRadius: '12px',
      }}
    >
      <thead>
        <tr>
          <th className="py-2.5 px-3 bg-pv-neutral-grey-50 h-9">
            <Skeleton
              variant="rectangular"
              width={54}
              height={20}
              className="bg-pv-neutral-grey-200"
            />
          </th>
          <th className="py-2.5 px-3 bg-pv-neutral-grey-50 h-9 ">
            <Skeleton
              variant="rectangular"
              width={135}
              height={20}
              className="bg-pv-neutral-grey-200"
            />
          </th>
          <th className="py-2.5 px-3 bg-pv-neutral-grey-50 h-9 ">
            <Skeleton
              variant="rectangular"
              width={152}
              height={20}
              className="bg-pv-neutral-grey-200"
            />
          </th>
          <th className="py-2.5 px-3 bg-pv-neutral-grey-50 h-9 ">
            <Skeleton
              variant="rectangular"
              width={152}
              height={20}
              className="bg-pv-neutral-grey-200"
            />
          </th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: 3 }, () => 1).map((_, idx) => (
          <tr key={idx}>
            <td className="py-2.5 px-3 ">
              <Skeleton
                variant="rectangular"
                width={64}
                height={20}
                style={{
                  backgroundColor: '#F8F9FC',
                  borderRadius: 4,
                }}
              />
            </td>
            <td className="py-2.5 px-3 ">
              <Skeleton
                variant="rectangular"
                width={135}
                height={20}
                style={{
                  backgroundColor: '#F8F9FC',
                  borderRadius: 4,
                }}
              />
            </td>
            <td className="py-2.5 px-3 ">
              <Skeleton
                variant="rectangular"
                width={152}
                height={20}
                style={{
                  backgroundColor: '#F8F9FC',
                  borderRadius: 4,
                }}
              />
            </td>
            <td className="py-2.5 px-3 ">
              <Skeleton
                variant="rectangular"
                width={152}
                height={20}
                style={{
                  backgroundColor: '#F8F9FC',
                  borderRadius: 4,
                }}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
