import { useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { joinToGroup } from '../entities/upload/groups.ts';
import { GroupUpdateFlagContext } from '../app/App.tsx';


export default function Connect() {

  const { token } = useParams();

  const navigate = useNavigate();

  const { setGroupUpdateFlag } = useContext(GroupUpdateFlagContext);

  joinToGroup(token ? token : "");
  setGroupUpdateFlag(true);
  navigate('/');

  return (
    <>
    </>
  );
}
