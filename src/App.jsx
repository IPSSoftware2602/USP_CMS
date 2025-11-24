import React, { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useSelector } from 'react-redux';
// import { toast } from "react-toastify";
// import { useSessionManager } from "./hooks/useSessionManager";
// import SessionWarningModal from "./pages/components/sessionWarningModal";
import AuthInterceptor from "./components/authinterceptor";

// home pages & dashboard
const Dashboard = lazy(() => import("./pages/dashboard"));

// outlet dashboard pages
const OutletDashboard = lazy(() => import("./pages/outlet_dashboard"));

// auth pages (login pages)
const Login = lazy(() => import("./pages/auth/login"));
const Login2 = lazy(() => import("./pages/auth/login2"));
const Login3 = lazy(() => import("./pages/auth/login3"));
const Error = lazy(() => import("./pages/404"));

//item pages
const Item = lazy(() => import("./pages/menu/item"));
const Category = lazy(() => import("./pages/menu/category"));

import Layout from "./layout/Layout";
import AuthLayout from "./layout/AuthLayout";

// components pages
const Button = lazy(() => import("./pages/components/button"));
const Dropdown = lazy(() => import("./pages/components/dropdown"));
const Badges = lazy(() => import("./pages/components/badges"));
const Colors = lazy(() => import("./pages/components/colors"));
const Typography = lazy(() => import("./pages/components/typography"));
const Alert = lazy(() => import("./pages/components/alert"));
const Progressbar = lazy(() => import("./pages/components/progress-bar"));
const Card = lazy(() => import("./pages/components/card"));
const Image = lazy(() => import("./pages/components/image"));
const Placeholder = lazy(() => import("./pages/components/placeholder"));
const Tooltip = lazy(() => import("./pages/components/tooltip-popover"));
const Modal = lazy(() => import("./pages/components/modal"));
const Carousel = lazy(() => import("./pages/components/carousel"));
const Pagination = lazy(() => import("./pages/components/pagination"));
const TabsAc = lazy(() => import("./pages/components/tab-accordion"));
const Video = lazy(() => import("./pages/components/video"));

const ComingSoonPage = lazy(() => import("./pages/utility/coming-soon"));
const UnderConstructionPage = lazy(() =>
  import("./pages/utility/under-construction")
);

const Profile = lazy(() => import("./pages/utility/profile"));
const IconPage = lazy(() => import("./pages/icons"));
const EditTopup = lazy(() => import("./pages/topup/settings/topup-edit"));
import Loading from "@/components/Loading";

import ItemAdd from "./pages/menu/item/item-add";
import ItemEditCategory from "./pages/menu/item/item-edit-category";
import ItemEditMenu from "./pages/menu/item/item-edit-menu";
import OptionGroupManager from "./pages/menu/item/option-group";
import AddCategory from "./pages/menu/category/category-add";
import EditCategory from "./pages/menu/category/category-edit";
import MemberPage from "./pages/member";
import AddMember from "./pages/member/member-add";
import MemberEditOverview from "./pages/member/member-edit-overview";
import EditProfileMember from "./pages/member/member-edit-profile";
import MemberEditAddress from "./pages/member/member-edit-address";
import MemberAddAddress from "./pages/member/member-e-add-address";
import MemberEditOrder from "./pages/member/member-edit-order";
import MemberTopup from "./pages/member/member-edit-topup";
import MemberEditWallet from "./pages/member/member-edit-wallet";
import MemberEditVoucher from "./pages/member/member-edit-voucher";
import MemberEditPoint from "./pages/member/member-edit-point";
import EditDetailsMemberOrder from "./pages/member/member-e-edit-order";
import EditMemberAddress from "./pages/member/member-e-edit-address";
import MemberEditAdjustPoint from "./pages/member/member-edit-adjustpoint";
import OrgChart from "./pages/member/member-chart";
import MemberAdjustWallet from "./pages/member/member-edit-adjustwallet";
import Outlet from "./pages/outlet";
import OutletMenuPage from "./pages/outlet/menu";
import AddOutletForm from "./pages/outlet/outlet-add";
import EditOutletForm from "./pages/outlet/outlet-edit";
import EditPasswordOutlet from "./pages/outlet/outlet-password";
import CustomMap from "./pages/components/customMap";
import { APIProvider } from "@vis.gl/react-google-maps";
import OrderList from "./pages/order/lists";
import OrderOverview from "./pages/order/order-overview";
import OrderPending from "./pages/order/pending";
import OrderConfirmed from "./pages/order/confirmed";
import Cancelled from "./pages/order/cancelled";
import Ontheway from "./pages/order/ontheway";
import Pickedup from "./pages/order/pickedup";
import Preparing from "./pages/order/preparing";
import Readytopickup from "./pages/order/readytopickup";
import EditTime from "./pages/order/editTime";
import EditStatus from "./pages/order/editStatus";
import TrackingLink from "./pages/order/trackinglink"
import VoucherInterface from "./pages/voucher/schedule";
import VoucherSchedule from "./pages/voucher/schedule";
import VoucherLists from "./pages/voucher/lists";
import AddVoucherLists from "./pages/voucher/lists-add";
import EditVoucherLists from "./pages/voucher/lists-edit";
import ScheduleAddForm from "./pages/voucher/schedule-add";
import ScheduleEditForm from "./pages/voucher/schedule-edit";
import PromoList from "./pages/promo/lists";
import AddPromoCode from "./pages/promo/lists/promo-add";
import EditPromo from "./pages/promo/lists/promo-edit";
import PWP from "./pages/promo/pwp";
import PWPAdd from "./pages/promo/pwp/pwp-add";
import PWPEdit from "./pages/promo/pwp/pwp-edit";
import UserData from "./pages/settings/user";
import UserEdit from "./pages/settings/user/user-edit";
import DeliverySettings from "./pages/settings/delivery";
import DeliveryAdd from "./pages/settings/delivery/delivery-add";
import DeliveryEdit from "./pages/settings/delivery/delivery-edit";
import AddNewUser from "./pages/settings/user/user-add";
import TaxSettings from "./pages/settings/tax";
import MembershipTiers from "./pages/settings/tier";
import CustomerTypes from "./pages/settings/custype";
import SlideshowSettings from "./pages/settings/slideshow";
import SlideshowAdd from "./pages/settings/slideshow/slideshow-add";
import SlideshowEdit from "./pages/settings/slideshow/slideshow-edit";
import TopUpPage from "./pages/topup/list";
import TopupSettings from "./pages/topup/settings";
import AddNewTopup from "./pages/topup/settings/topup-add";
// import EditTopup from "./pages/topup/settings/topup-edit";
import StudentCard from "./pages/student_card";
import StudentCardApproval from "./pages/student_card/student-card-approve";
import SendVoucherLists from "./pages/voucher/send-voucher";
import DiscountList from "./pages/promo/discount";
import CreateDiscount from "./pages/promo/discount/add_new_discount";
import UpdateDiscount from "./pages/promo/discount/update_discount";
import FirstTimeRegister from "./pages/settings/membership/first_time_register";
import FirstTimePurchaseBonus from "./pages/settings/membership/first_time_purchase_bonus";
// import PurchaseVoucher from "./pages/settings/membership/purchase_voucher";
import ReferralBonus from "./pages/settings/membership/referral_bonus";
import ReferralFirstPurchase from "./pages/settings/membership/referral_first_purchase";
import ExtraBonus from "./pages/settings/membership/extra_bonus";
import BirthdayBonus from "./pages/settings/membership/birthday_bonus";
import PromoCodeLists from "./pages/promo/promo_code";
import PromoCodeAdd from "./pages/promo/promo_code/promo-code-add";
import PromoCodeEdit from "./pages/promo/promo_code/promo-code-edit";
import CsvExport from "./pages/csv/index";

import SalesReport from "./pages/report/sales";
import PromoReport from "./pages/report/promo";
import ProductReport from "./pages/report/product";
import OrderReport from "./pages/report/order";
import WalletReport from "./pages/report/wallet";
import PointReport from "./pages/report/point";
import UnutilizedReport from "./pages/report/unutilized";

function App() {
  const navigate = useNavigate();
  const { isAuth } = useSelector(state => state.auth);
  // const {
  //   showWarning,
  //   timeLeft,
  //   timeLeftMs,
  //   expirationInfo,
  //   checkAutoLogin,
  //   extendSession,
  //   handleLogout,
  //   handleSessionExpiry, // Make sure this is destructured from useSessionManager
  //   checkSession // Make sure this is destructured from useSessionManager
  // } = useSessionManager();

  // useEffect(() => {
  //   console.log('App mounted, checking auto login...');
  //   if (!isAuth) {
  //     const autoLoggedIn = checkAutoLogin();
  //     if (autoLoggedIn) {
  //       console.log('Auto login successful, navigating to dashboard');
  //       navigate("/dashboard");
  //     } else {
  //       navigate("/login");
  //     }
  //   }
  // }, []);


  useEffect(() => {
    if (isAuth && window.location.pathname === '/') {
      navigate("/dashboard");
    }
  }, [isAuth, navigate]);

  return (
    <main className="App relative">
      <AuthInterceptor />
      <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
        <Routes>
          <Route path="/" element={<AuthLayout />}>
            <Route index element={<Login />} />
            <Route path="login2" element={<Login2 />} />
            <Route path="login3" element={<Login3 />} />
          </Route>

          <Route path="/*" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="outlet_dashboard" element={<OutletDashboard />} />

            <Route path="orders">
              <Route index element={<Navigate to="order_lists" />} />
              <Route path="order_lists" element={< OrderList />} />
              <Route path="order_pending" element={< OrderPending />} />
              <Route path="order_confirmed" element={< OrderConfirmed />} />
              <Route path="order_cancelled" element={<Cancelled />} />
              <Route path="order_ontheway" element={<Ontheway />} />
              <Route path="order_pickedup" element={<Pickedup />} />
              <Route path="order_preparing" element={<Preparing />} />
              <Route path="order_readtopickup" element={<Readytopickup />} />
              <Route path="order_lists/order_overview/:id" element={< OrderOverview />} />
              <Route path="order_pending/order_overview/:id" element={< OrderOverview />} />
              <Route path="order_confirmed/order_overview/:id" element={< OrderOverview />} />
              <Route path="order_overview/editTime/:id" element={<EditTime />} />
              <Route path="order_overview/editStatus/:id" element={<EditStatus />} />
              <Route path="order_overview/trackinglink/:id" element={<TrackingLink />} />
            </Route>

            <Route path="topup">
              <Route index element={<Navigate to="topup_lists" />} />
              <Route path="topup_lists" element={<TopUpPage />} />
              <Route path="topup_settings" element={<TopupSettings />} />
              <Route path="topup_settings/add_new_topup" element={<AddNewTopup />} />
              <Route path="topup_settings/edit_topup/:id" element={<EditTopup />} />
            </Route>

            <Route path="outlets">
              <Route index element={<Navigate to="list" />} />
              <Route path="list" element={<Outlet />} />
              <Route path="list/add_new_outlet" element={<AddOutletForm />} />
              <Route path="list/edit_outlet/:id" element={<EditOutletForm />} />
              <Route path="list/edit_password/:id" element={<EditPasswordOutlet />} />
              <Route path="menu" element={<OutletMenuPage />} />
              {/* If you need nested menu routes, you can add them here */}
            </Route>

            <Route path="menu">
              <Route index element={<Navigate to="item" />} />
              <Route path="item" element={<Item />} />
              <Route path="item/add_item" element={<ItemAdd />} />
              <Route path="item/edit_category" element={<ItemEditCategory />} />
              <Route path="item/edit_item/:id" element={<ItemEditMenu />} />
              <Route path="item/add_item/option_group" element={<OptionGroupManager />} />
              <Route path="category" element={<Category />} />
              <Route path="category/add_category" element={<AddCategory />} />
              <Route path="category/edit_category/:id" element={<EditCategory />} />
            </Route>

            <Route path="voucher">
              <Route index element={<Navigate to="lists" />} />
              <Route path="lists" element={<VoucherLists />} />
              <Route path="lists/add_voucher_lists" element={<AddVoucherLists />} />
              <Route path="lists/edit_voucher_lists/:voucherId" element={<EditVoucherLists />} />
              <Route path="send_voucher" element={<SendVoucherLists />} />
              <Route path="schedule" element={<VoucherSchedule />} />
              <Route path="schedule/add_new_schedule" element={<ScheduleAddForm />} />
              <Route path="schedule/edit_schedule/:scheduleId" element={<ScheduleEditForm />} />
            </Route>

            <Route path="promo">
              <Route index element={<Navigate to="promo_lists" />} />
              <Route path="promo_lists" element={<PromoList />} />
              <Route path="promo_lists/add_new_promo_code" element={<AddPromoCode />} />
              <Route path="promo_lists/edit_promo/:id" element={<EditPromo />} />
              <Route path="pwp" element={<PWP />} />
              <Route path="pwp/add_new_pwp" element={<PWPAdd />} />
              <Route path="pwp/edit_pwp/:id" element={<PWPEdit />} />
              <Route path="discount" element={<DiscountList/>}/>
              <Route path="discount/add_new_discount" element={<CreateDiscount/>}/>
              <Route path="discount/update_discount/:id" element={<UpdateDiscount/>}/>
              <Route path="promo_code" element={<PromoCodeLists />} />
              <Route path="promo_code/new" element={<PromoCodeAdd />} />
              <Route path="promo_code/edit/:id" element={<PromoCodeEdit />} />
            </Route>

            <Route path="settings">
              <Route index element={< UserData />} />
              <Route path="user" element={<UserData />} />
              <Route path="user/user-edit/:id" element={<UserEdit />} />
              <Route path="user/add_new_user" element={<AddNewUser />} />
              <Route path="tax" element={< TaxSettings />} />
              <Route path="membership_tier" element={<MembershipTiers />} />
              <Route path="customer_type" element={<CustomerTypes />} />
              <Route path="delivery_settings" element={<DeliverySettings />} />
              <Route path="add_new_delivery_zone" element={< DeliveryAdd />} />
              <Route path="edit_delivery_zone/:id" element={< DeliveryEdit />} />
              <Route path="slideshow_settings" element={< SlideshowSettings />} />
              <Route path="add_new_slideshow" element={< SlideshowAdd />} />
              <Route path="edit_slideshow/:id" element={< SlideshowEdit />} />
              <Route path="membership/first_time_register" element={< FirstTimeRegister />} />
              <Route path="membership/first_time_purchase_bonus" element={< FirstTimePurchaseBonus />} />
              {/* <Route path="membership/purchase_voucher" element={< PurchaseVoucher />} /> */}
              {/* <Route path="membership/referral_bonus" element={< ReferralBonus />} /> */}
              {/* <Route path="membership/first_time_purchase_bonus" element={< FirstTimePurchaseBonus />} />
              <Route path="membership/purchase_voucher" element={< PurchaseVoucher />} />
              <Route path="membership/referral_first_purchase" element={< ReferralFirstPurchase />} />
               */}
              <Route path="membership/referral_first_purchase" element={< ReferralFirstPurchase />} />
              <Route path="membership/extra_bonus" element={< ExtraBonus />} />
              <Route path="membership/referral_bonus" element={< ReferralBonus />} />
              <Route path="membership/birthday_bonus" element={< BirthdayBonus />} />
              <Route path="membership/referral_first_purchase" element={< ReferralFirstPurchase />} />
            </Route>

            {/* Member routes */}
            <Route path="member">
              <Route index element={<MemberPage />} />
              <Route path="add_new_member" element={<AddMember />} />
              <Route path="org_chart" element={<OrgChart />} />
              <Route path="member_overview/:id" element={<MemberEditOverview />} />
              <Route path="member_overview/member_address/:id" element={<MemberEditAddress />} />
              <Route path="member_overview/member_address/add_member_address/:id" element={<MemberAddAddress />} />
              <Route path="member_overview/member_address/edit_member_address/:addressId" element={<EditMemberAddress />} />
              <Route path="member_overview/member_order/:id" element={<MemberEditOrder />} />
              <Route path="member_overview/member_order/edit_order" element={<EditDetailsMemberOrder />} />
              <Route path="member_overview/member_point/:id" element={<MemberEditPoint />} />
              <Route path="member_overview/member_point/adjust_point/:id" element={<MemberEditAdjustPoint />} />
              <Route path="member_overview/member_profile/:id" element={<EditProfileMember />} />
              <Route path="member_overview/member_topup/:id" element={<MemberTopup />} />
              <Route path="member_overview/member_wallet/:id" element={<MemberEditWallet />} />
              <Route path="member_overview/member_wallet/adjust_wallet/:id" element={<MemberAdjustWallet />} />
              <Route path="member_overview/member_voucher/:id" element={<MemberEditVoucher />} />
            </Route>

            {/* Student Card routes */}
            <Route path="student-card">
              <Route index element={<StudentCard />} />
              <Route path="student_card_approval/:id" element={<StudentCardApproval />} />
            </Route>

            <Route path="csv-export">
              <Route index element={<CsvExport />} />
            </Route>
            <Route path="report">
              <Route index element={<Navigate to="sales" />} />
              <Route path="sales" element={<SalesReport />} />
              <Route path="promo" element={<PromoReport />} />
              <Route path="product" element={<ProductReport />} />
              <Route path="order" element={<OrderReport />} />
              <Route path="wallet" element={<WalletReport />} />
              <Route path="point" element={<PointReport />} />
              <Route path="unutilized" element={<UnutilizedReport />} />
            </Route>

            {/* Components pages */}
            <Route path="button" element={<Button />} />
            <Route path="dropdown" element={<Dropdown />} />
            <Route path="badges" element={<Badges />} />
            <Route path="colors" element={<Colors />} />
            <Route path="typography" element={<Typography />} />
            <Route path="alert" element={<Alert />} />
            <Route path="progress-bar" element={<Progressbar />} />
            <Route path="card" element={<Card />} />
            <Route path="image" element={<Image />} />
            <Route path="Placeholder" element={<Placeholder />} />
            <Route path="tooltip-popover" element={<Tooltip />} />
            <Route path="modal" element={<Modal />} />
            <Route path="carousel" element={<Carousel />} />
            <Route path="Paginations" element={<Pagination />} />
            <Route path="tab-accordion" element={<TabsAc />} />
            <Route path="video" element={<Video />} />
            <Route path="profile" element={<Profile />} />
            <Route path="icons" element={<IconPage />} />

            <Route path="*" element={<Navigate to="/404" />} />
          </Route>

          <Route
            path="/404"
            element={
              <Suspense fallback={<Loading />}>
                <Error />
              </Suspense>
            }
          />
          <Route
            path="/coming-soon"
            element={
              <Suspense fallback={<Loading />}>
                <ComingSoonPage />
              </Suspense>
            }
          />
          <Route
            path="/under-construction"
            element={
              <Suspense fallback={<Loading />}>
                <UnderConstructionPage />
              </Suspense>
            }
          />
        </Routes>

        {/* <SessionWarningModal
          isOpen={showWarning}
          timeLeft={timeLeft}
          timeLeftMs={timeLeftMs}
          onExtend={extendSession}
          onLogout={handleLogout}
        /> */}
      </APIProvider>
    </main>
  );
}

export default App;