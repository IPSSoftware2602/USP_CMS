import { useState, useEffect } from 'react';
import UserService from '@/store/api/userService';

const useExportPermission = () => {
    const [hasExportPermission, setHasExportPermission] = useState(false);

    useEffect(() => {
        const fetchPermission = async () => {
            try {
                const userStr = localStorage.getItem('user');
                if (!userStr) return;
                const userObj = JSON.parse(userStr);
                const user_id = userObj?.user?.user_id;
                if (!user_id) return;

                const userDataRes = await UserService.getUser(user_id);
                const userData = userDataRes?.data;
                if (!userData) return;

                if (userData.role && userData.role.toLowerCase() === 'admin') {
                    setHasExportPermission(true);
                    return;
                }

                if (userData.user_permissions) {
                    try {
                        const permissions = JSON.parse(userData.user_permissions);
                        if (permissions['Excel Report'] && permissions['Excel Report'].read === true) {
                            setHasExportPermission(true);
                        }
                    } catch (e) {
                        console.error("Error parsing user permissions:", e);
                    }
                }
            } catch (err) {
                console.error("Error fetching user permissions:", err);
            }
        };

        fetchPermission();
    }, []);

    return hasExportPermission;
};

export default useExportPermission;
